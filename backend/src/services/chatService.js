import { randomUUID } from "node:crypto";
import { mensajePrivadoRepository } from "../repositories/mensajePrivadoRepository.js";
import { notificacionRepository } from "../repositories/notificacionRepository.js";
import { storageRepository } from "../repositories/storageRepository.js";
import { esImagenValida } from "../helpers/validarImagen.js";
import { amistadRepository } from "../repositories/amistadRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { mensajeRepository } from "../repositories/mensajeRepository.js";
import { toGrupo } from "../entities/Grupo.js";
import { toMensaje } from "../entities/Mensaje.js";
import { toMensajePrivado } from "../entities/MensajePrivado.js";
import { toUsuarioResumen } from "../entities/Usuario.js";
import { ApiError } from "../helpers/ApiError.js";

const EXTENSIONES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Solo se puede chatear con amigos (amistad aceptada). Se chequea en cada
// lectura y envio: si se elimina la amistad, el chat deja de estar disponible.
async function exigirAmistad(idUsuarioAutenticado, idOtroUsuario) {
  if (idUsuarioAutenticado === idOtroUsuario) {
    throw ApiError.badRequest("No podés chatear con vos mismo");
  }

  const amistad = await amistadRepository.buscarEntreUsuarios(idUsuarioAutenticado, idOtroUsuario);
  if (amistad?.estado !== "aceptada") {
    throw ApiError.forbidden("Solo podés chatear con tus amigos");
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

async function armarChatsPrivados(idUsuarioAutenticado) {
  const relaciones = await amistadRepository.listarAceptadasDeUsuario(idUsuarioAutenticado);
  const idsAmigos = relaciones.map((r) =>
    r.id_solicitante === idUsuarioAutenticado ? r.id_receptor : r.id_solicitante
  );
  if (idsAmigos.length === 0) return [];

  const [usuarios, recientes, noLeidos] = await Promise.all([
    usuarioRepository.listarPorIds(idsAmigos),
    mensajePrivadoRepository.listarRecientesDeUsuario(idUsuarioAutenticado),
    mensajePrivadoRepository.listarNoLeidosDeUsuario(idUsuarioAutenticado),
  ]);

  // `recientes` viene del mas nuevo al mas viejo: el primero que aparece
  // de cada amigo es su ultimo mensaje.
  const ultimoPorAmigo = new Map();
  for (const fila of recientes) {
    const idOtro = fila.id_emisor === idUsuarioAutenticado ? fila.id_receptor : fila.id_emisor;
    if (!ultimoPorAmigo.has(idOtro)) ultimoPorAmigo.set(idOtro, fila);
  }

  const noLeidosPorAmigo = contarPor(noLeidos, "id_emisor");

  return usuarios.map((fila) => ({
    tipo: "privado",
    usuario: toUsuarioResumen(fila),
    ultimoMensaje: toMensajePrivado(ultimoPorAmigo.get(fila.id_usuario)),
    noLeidos: noLeidosPorAmigo.get(fila.id_usuario) || 0,
  }));
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
  // Lista de chats estilo WhatsApp: un chat privado por cada amigo y un
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

  async contarNoLeidos(idUsuarioAutenticado) {
    const [privados, grupales] = await Promise.all([
      mensajePrivadoRepository.listarNoLeidosDeUsuario(idUsuarioAutenticado),
      notificacionRepository.listarNoLeidasMensajesGrupo(idUsuarioAutenticado),
    ]);
    return { total: privados.length + grupales.length };
  },

  // Abrir un chat lo marca como leido.
  async listarMensajes(idUsuarioAutenticado, idOtroUsuario, opciones) {
    await exigirAmistad(idUsuarioAutenticado, idOtroUsuario);

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
    if (!texto && !archivo) {
      throw ApiError.badRequest("El mensaje no puede estar vacío");
    }
    if (archivo && !esImagenValida(archivo)) {
      throw ApiError.badRequest("El archivo debe ser una imagen válida (jpg, png o webp)");
    }

    await exigirAmistad(idUsuarioAutenticado, idOtroUsuario);

    let imagen = null;
    if (archivo) {
      const ruta = `${idUsuarioAutenticado}/${randomUUID()}.${EXTENSIONES[archivo.mimetype]}`;
      imagen = await storageRepository.subirArchivo("chats", ruta, archivo.buffer, archivo.mimetype);
    }

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

  // Cuando llega un mensaje por Realtime con el chat abierto.
  async marcarLeidos(idUsuarioAutenticado, idOtroUsuario) {
    await marcarChatLeido(idUsuarioAutenticado, idOtroUsuario);
    return { ok: true };
  },
};
