import { mensajePrivadoRepository } from "../repositories/mensajePrivadoRepository.js";
import { notificacionRepository } from "../repositories/notificacionRepository.js";
import { amistadRepository } from "../repositories/amistadRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { mensajeRepository } from "../repositories/mensajeRepository.js";
import { toGrupo } from "../entities/Grupo.js";
import { toMensaje } from "../entities/Mensaje.js";
import { toMensajePrivado } from "../entities/MensajePrivado.js";
import { toUsuarioResumen } from "../entities/Usuario.js";
import { ApiError } from "../helpers/ApiError.js";
import { exigirSinBloqueo } from "./bloqueoService.js";
import { bloqueoRepository } from "../repositories/bloqueoRepository.js";
import { subirFotoDeChat, validarTextoOFoto } from "./fotosChat.js";
import { contieneMalasPalabras, MENSAJE_MALAS_PALABRAS } from "../helpers/filtroPalabras.js";
import { preferenciasDe } from "../helpers/preferencias.js";

// Se puede chatear con cualquiera (sin un bloqueo de por medio), como en
// Instagram: si no son amigos y quien recibe todavía no contestó, el chat le
// llega como "solicitud de mensaje" (ver armarChatsPrivados).
// Mientras la otra persona no conteste, se le pueden mandar pocos mensajes:
// así nadie llena de spam la bandeja de un desconocido.
export const MAX_MENSAJES_SIN_RESPUESTA = 3;

async function exigirOtroUsuario(idUsuarioAutenticado, idOtroUsuario) {
  if (idUsuarioAutenticado === idOtroUsuario) {
    throw ApiError.badRequest("No podés chatear con vos mismo");
  }
  await exigirSinBloqueo(idUsuarioAutenticado, idOtroUsuario);

  const otro = await usuarioRepository.obtenerPorId(idOtroUsuario);
  if (!otro || otro.estado === "suspendido") throw ApiError.notFound("El usuario no existe");
  return otro;
}

async function sonAmigos(idUsuarioA, idUsuarioB) {
  const amistad = await amistadRepository.buscarEntreUsuarios(idUsuarioA, idUsuarioB);
  return amistad?.estado === "aceptada";
}

// Antes de mandar: respeta "Quién te puede escribir" de quien recibe y el
// tope de mensajes a alguien que no es amigo y no contestó.
async function exigirPuedeEscribir(idUsuarioAutenticado, idOtroUsuario) {
  const receptor = await exigirOtroUsuario(idUsuarioAutenticado, idOtroUsuario);
  const quienPuede = preferenciasDe(receptor).mensajes;
  if (quienPuede === "nadie") {
    throw ApiError.forbidden("Esta persona no está recibiendo mensajes");
  }
  if (await sonAmigos(idUsuarioAutenticado, idOtroUsuario)) return;

  const ultimos = await mensajePrivadoRepository.listarConversacion(idUsuarioAutenticado, idOtroUsuario, {
    limite: 50,
  });
  const meEscribio = ultimos.some((m) => m.id_emisor === idOtroUsuario);
  // Contestarle a alguien que te escribió primero siempre se puede.
  if (meEscribio) return;

  if (quienPuede === "amigos") {
    throw ApiError.forbidden("Esta persona solo recibe mensajes de sus amigos");
  }
  const enviados = ultimos.filter((m) => m.id_emisor === idUsuarioAutenticado).length;
  if (enviados >= MAX_MENSAJES_SIN_RESPUESTA) {
    throw ApiError.forbidden(
      "Ya le mandaste una solicitud de mensaje. Esperá a que te conteste para seguir escribiendo."
    );
  }
}

// Mensajes recibidos de ese amigo -> leídos (tildes) y sus notificaciones
// -> leídas.
async function marcarChatLeido(idUsuarioAutenticado, idOtroUsuario) {
  await Promise.all([
    mensajePrivadoRepository.marcarLeidos(idUsuarioAutenticado, idOtroUsuario),
    notificacionRepository.marcarLeidasMensajesPrivados(idUsuarioAutenticado, idOtroUsuario),
  ]);
}

function nombreDelChat(chat) {
  return chat.tipo === "grupo" ? chat.grupo.nombre || "" : chat.usuario.nombre || "";
}

// Un chat por cada amigo y por cada persona con la que hay mensajes. Los de
// alguien que no es amigo y al que todavía no le contesté son
// "solicitudes" (solicitud: true): el frontend los muestra aparte.
async function armarChatsPrivados(idUsuarioAutenticado) {
  const [relaciones, recientes, noLeidos, bloqueados] = await Promise.all([
    amistadRepository.listarAceptadasDeUsuario(idUsuarioAutenticado),
    mensajePrivadoRepository.listarRecientesDeUsuario(idUsuarioAutenticado),
    mensajePrivadoRepository.listarNoLeidosDeUsuario(idUsuarioAutenticado),
    bloqueoRepository.idsConBloqueo(idUsuarioAutenticado),
  ]);
  const idsAmigos = new Set(
    relaciones.map((r) => (r.id_solicitante === idUsuarioAutenticado ? r.id_receptor : r.id_solicitante))
  );

  // `recientes` viene del mas nuevo al mas viejo: el primero que aparece
  // de cada persona es su ultimo mensaje.
  const ultimoPorUsuario = new Map();
  const lesEscribi = new Set();
  for (const fila of recientes) {
    const idOtro = fila.id_emisor === idUsuarioAutenticado ? fila.id_receptor : fila.id_emisor;
    if (!ultimoPorUsuario.has(idOtro)) ultimoPorUsuario.set(idOtro, fila);
    if (fila.id_emisor === idUsuarioAutenticado) lesEscribi.add(idOtro);
  }

  const ids = [...new Set([...idsAmigos, ...ultimoPorUsuario.keys()])].filter(
    (id) => id !== idUsuarioAutenticado && !bloqueados.has(id)
  );
  if (ids.length === 0) return [];

  const usuarios = await usuarioRepository.listarActivosPorIds(ids);
  const noLeidosPorUsuario = contarPor(noLeidos, "id_emisor");

  return usuarios.map((fila) => {
    const esAmigo = idsAmigos.has(fila.id_usuario);
    return {
      tipo: "privado",
      usuario: toUsuarioResumen(fila),
      ultimoMensaje: toMensajePrivado(ultimoPorUsuario.get(fila.id_usuario)),
      noLeidos: noLeidosPorUsuario.get(fila.id_usuario) || 0,
      esAmigo,
      solicitud: !esAmigo && !lesEscribi.has(fila.id_usuario),
    };
  });
}

async function armarChatsGrupales(idUsuarioAutenticado) {
  const relaciones = await grupoUsuarioRepository.listarGruposPorUsuario(idUsuarioAutenticado);
  const idsGrupo = relaciones.map((r) => r.id_grupo);
  if (idsGrupo.length === 0) return [];

  const [grupos, miembros, recientes, noLeidas] = await Promise.all([
    grupoRepository.listarPorIds(idsGrupo),
    grupoUsuarioRepository.listarUsuariosPorGrupos(idsGrupo),
    mensajeRepository.listarRecientesDeGrupos(idsGrupo),
    notificacionRepository.listarNoLeidasMensajesGrupo(idUsuarioAutenticado),
  ]);

  const filasUsuarios = await usuarioRepository.listarPorIds([
    ...new Set(miembros.map((m) => m.id_usuario)),
  ]);
  const usuarioPorId = new Map(filasUsuarios.map((f) => [f.id_usuario, toUsuarioResumen(f)]));

  const ultimoPorGrupo = new Map();
  for (const fila of recientes) {
    if (!ultimoPorGrupo.has(fila.id_grupo)) ultimoPorGrupo.set(fila.id_grupo, fila);
  }

  const noLeidosPorGrupo = contarPor(noLeidas, "id_grupo");

  return grupos.map((grupo) => {
    const usuarios = miembros
      .filter((m) => m.id_grupo === grupo.id_grupo)
      .map((m) => usuarioPorId.get(m.id_usuario))
      .filter(Boolean);
    const ultimo = ultimoPorGrupo.get(grupo.id_grupo);

    return {
      tipo: "grupo",
      grupo: { ...toGrupo(grupo, { usuarios }) },
      ultimoMensaje: ultimo
        ? toMensaje(ultimo, { usuario: filasUsuarios.find((f) => f.id_usuario === ultimo.id_usuario) })
        : null,
      noLeidos: noLeidosPorGrupo.get(grupo.id_grupo) || 0,
    };
  });
}

function contarPor(filas, campo) {
  const conteo = new Map();
  for (const fila of filas) conteo.set(fila[campo], (conteo.get(fila[campo]) || 0) + 1);
  return conteo;
}

export const chatService = {
  // Lista de chats estilo WhatsApp: un chat privado por cada amigo (y por
  // cada persona con la que hay mensajes, ver armarChatsPrivados) y un
  // chat grupal por cada grupo del que es miembro (el chat de un grupo
  // existe desde que se crea el grupo). Primero los que tienen mensajes, el
  // más reciente arriba; después el resto por nombre.
  async listarChats(idUsuarioAutenticado) {
    const [privados, grupales] = await Promise.all([
      armarChatsPrivados(idUsuarioAutenticado),
      armarChatsGrupales(idUsuarioAutenticado),
    ]);

    return [...privados, ...grupales].sort((a, b) => {
      if (a.ultimoMensaje && b.ultimoMensaje) {
        return new Date(b.ultimoMensaje.created_at) - new Date(a.ultimoMensaje.created_at);
      }
      if (a.ultimoMensaje) return -1;
      if (b.ultimoMensaje) return 1;
      return nombreDelChat(a).localeCompare(nombreDelChat(b));
    });
  },

  // `total` = mensajes sin leer de los chats; las solicitudes de mensaje
  // se cuentan aparte (como en Instagram, no suman al globito).
  async contarNoLeidos(idUsuarioAutenticado) {
    const [privados, grupales] = await Promise.all([
      armarChatsPrivados(idUsuarioAutenticado),
      notificacionRepository.listarNoLeidasMensajesGrupo(idUsuarioAutenticado),
    ]);
    const deChats = privados.filter((c) => !c.solicitud).reduce((total, c) => total + c.noLeidos, 0);
    const solicitudes = privados.filter((c) => c.solicitud && c.noLeidos > 0).length;
    return { total: deChats + grupales.length, solicitudes };
  },

  // Abrir un chat lo marca como leido.
  async listarMensajes(idUsuarioAutenticado, idOtroUsuario, opciones) {
    await exigirOtroUsuario(idUsuarioAutenticado, idOtroUsuario);

    const filas = await mensajePrivadoRepository.listarConversacion(
      idUsuarioAutenticado,
      idOtroUsuario,
      opciones
    );
    // Solo la primera página (al abrir el chat) marca como leído; al
    // cargar mensajes viejos no hace falta.
    if (!opciones?.antesDeId) {
      await marcarChatLeido(idUsuarioAutenticado, idOtroUsuario);
    }

    return filas.map(toMensajePrivado);
  },

  // Texto, foto o las dos cosas. La foto se valida por sus bytes reales
  // (igual que la foto de perfil) y se guarda con un nombre aleatorio.
  async enviar(idUsuarioAutenticado, idOtroUsuario, { contenido = "", archivo } = {}) {
    const texto = contenido.trim();
    validarTextoOFoto(texto, archivo);
    if (contieneMalasPalabras(texto)) {
      throw ApiError.badRequest(MENSAJE_MALAS_PALABRAS);
    }

    await exigirPuedeEscribir(idUsuarioAutenticado, idOtroUsuario);

    const imagen = archivo ? await subirFotoDeChat(idUsuarioAutenticado, archivo) : null;

    const fila = await mensajePrivadoRepository.crear({
      idEmisor: idUsuarioAutenticado,
      idReceptor: idOtroUsuario,
      contenido: texto,
      imagen,
    });
    return toMensajePrivado(fila);
  },

  // Al abrir el chat de un grupo (o recibir un mensaje con el chat abierto):
  // sus notificaciones de mensajes pasan a leídas.
  async marcarGrupoLeido(idUsuarioAutenticado, idGrupo) {
    const esMiembro = await grupoUsuarioRepository.existeRelacion(idUsuarioAutenticado, idGrupo);
    if (!esMiembro) throw ApiError.forbidden("No pertenecés a este grupo");

    await notificacionRepository.marcarLeidasMensajesGrupo(idUsuarioAutenticado, idGrupo);
    return { ok: true };
  },

  // Eliminar una solicitud de mensaje: se borran los mensajes que esa
  // persona me mandó (y sus notificaciones). Solo si no somos amigos y
  // nunca le contesté; si vuelve a escribir, llega otra solicitud.
  async eliminarSolicitud(idUsuarioAutenticado, idOtroUsuario) {
    if (idUsuarioAutenticado === idOtroUsuario) {
      throw ApiError.badRequest("No podés chatear con vos mismo");
    }
    if (await sonAmigos(idUsuarioAutenticado, idOtroUsuario)) {
      throw ApiError.badRequest("Ese chat no es una solicitud de mensaje");
    }
    const conversacion = await mensajePrivadoRepository.listarConversacion(
      idUsuarioAutenticado,
      idOtroUsuario,
      { limite: 50 }
    );
    if (conversacion.some((m) => m.id_emisor === idUsuarioAutenticado)) {
      throw ApiError.badRequest("Ese chat no es una solicitud de mensaje");
    }

    await Promise.all([
      mensajePrivadoRepository.eliminarRecibidos(idUsuarioAutenticado, idOtroUsuario),
      notificacionRepository.marcarLeidasMensajesPrivados(idUsuarioAutenticado, idOtroUsuario),
    ]);
    return { ok: true };
  },

  // Cuando llega un mensaje por Realtime con el chat abierto.
  async marcarLeidos(idUsuarioAutenticado, idOtroUsuario) {
    await marcarChatLeido(idUsuarioAutenticado, idOtroUsuario);
    return { ok: true };
  },
};
