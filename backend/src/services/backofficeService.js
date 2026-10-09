import { backofficeRepository } from "../repositories/backofficeRepository.js";
import { reporteRepository } from "../repositories/reporteRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import {
  conciertoRepository,
  usuariosConciertosRepository,
} from "../repositories/conciertoRepository.js";
import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { mensajeRepository } from "../repositories/mensajeRepository.js";
import { mensajePrivadoRepository } from "../repositories/mensajePrivadoRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { toConciertoResumen } from "../entities/Concierto.js";
import { ApiError } from "../helpers/ApiError.js";
import { env } from "../config/env.js";

// Cuántos mensajes de contexto ve el moderador al revisar un reporte.
const MENSAJES_DE_CONTEXTO = 100;

function resumenUsuario(fila) {
  if (!fila) return null;
  return {
    id_usuario: fila.id_usuario,
    nombre: fila.nombre,
    mail: fila.mail,
    fotoperfil: fila.fotoperfil,
    estado: fila.estado || "activo",
    rol: fila.rol || "usuario",
    motivo_suspension: fila.motivo_suspension || null,
    suspendido_at: fila.suspendido_at || null,
  };
}

async function usuariosPorId(ids) {
  const unicos = [...new Set(ids.filter(Boolean))];
  if (unicos.length === 0) return new Map();
  const filas = await usuarioRepository.listarPorIds(unicos);
  return new Map(filas.map((f) => [f.id_usuario, resumenUsuario(f)]));
}

async function completarReportes(reportes) {
  const usuarios = await usuariosPorId(
    reportes.flatMap((r) => [r.id_reportante, r.id_reportado, r.id_moderador])
  );
  const idsGrupo = [...new Set(reportes.map((r) => r.id_grupo).filter(Boolean))];
  const grupos = idsGrupo.length ? await grupoRepository.listarPorIds(idsGrupo) : [];
  const nombresGrupo = new Map(grupos.map((g) => [g.id_grupo, g.nombre]));

  return reportes.map((r) => ({
    ...r,
    reportante: usuarios.get(r.id_reportante) || null,
    reportado: usuarios.get(r.id_reportado) || null,
    moderador: usuarios.get(r.id_moderador) || null,
    grupo: r.id_grupo ? { id_grupo: r.id_grupo, nombre: nombresGrupo.get(r.id_grupo) || "Grupo eliminado" } : null,
  }));
}

function armarMensajes(filas, usuarios, campoAutor) {
  return filas.map((m) => ({
    id_mensaje: m.id_mensaje,
    contenido: m.contenido,
    imagen: m.imagen || null,
    created_at: m.created_at,
    autor: usuarios.get(m[campoAutor]) || { id_usuario: m[campoAutor], nombre: "Usuario" },
  }));
}

// Avisa a todos los fans unidos a un concierto, pero solo si son
// "muchos" (MINIMO_UNIDOS_PARA_NOTIFICAR). Devuelve a cuántos les llegó.
async function notificarFans(concierto, { titulo, descripcion }) {
  const relaciones = await usuariosConciertosRepository.listarUsuariosPorConcierto(
    concierto.id_concierto
  );
  const minimo = env.minimoUnidosParaNotificar;
  if (relaciones.length < minimo) {
    return { notificados: 0, unidos: relaciones.length, minimo };
  }

  await backofficeRepository.crearNotificaciones(
    relaciones.map((r) => ({
      id_usuario: r.id_usuario,
      tipo: "novedad_concierto",
      titulo,
      descripcion,
      imagen: concierto.imagenConcierto || "",
      id_concierto: concierto.id_concierto,
    }))
  );
  return { notificados: relaciones.length, unidos: relaciones.length, minimo };
}

const NOMBRES_CAMPO = {
  nombre: "el nombre",
  fecha: "la fecha y hora",
  id_estadio: "el estadio",
  imagenConcierto: "la imagen",
  id_estiloMusical: "el género",
  id_artista: "el artista",
};

export const backofficeService = {
  async resumen() {
    const [usuarios, suspendidos, reportesPendientes, conciertos, grupos] = await Promise.all([
      backofficeRepository.contar("usuario"),
      backofficeRepository.contar("usuario", { columna: "estado", valor: "suspendido" }),
      reporteRepository.contarPendientes(),
      backofficeRepository.contar("concierto"),
      backofficeRepository.contar("grupo"),
    ]);
    return { usuarios, suspendidos, reportesPendientes, conciertos, grupos };
  },

  // ---------- Usuarios ----------

  async listarUsuarios(filtros) {
    const filas = await backofficeRepository.listarUsuarios(filtros);
    return filas.map(resumenUsuario);
  },

  async detalleUsuario(idUsuario) {
    const usuario = await usuarioRepository.obtenerPorId(idUsuario);
    if (!usuario) throw ApiError.notFound("El usuario no existe");

    const [reportes, relacionesConcierto, relacionesGrupo] = await Promise.all([
      reporteRepository.listarDeUsuario(idUsuario),
      usuariosConciertosRepository.listarConciertosPorUsuario(idUsuario),
      grupoUsuarioRepository.listarGruposPorUsuario(idUsuario),
    ]);
    const [conciertos, grupos, reportesCompletos] = await Promise.all([
      Promise.all(relacionesConcierto.map((r) => conciertoRepository.obtenerPorId(r.id_concierto))),
      relacionesGrupo.length
        ? grupoRepository.listarPorIds(relacionesGrupo.map((r) => r.id_grupo))
        : [],
      completarReportes(reportes),
    ]);

    return {
      ...resumenUsuario(usuario),
      fechanac: usuario.fechanac,
      genero: usuario.genero,
      conciertos: conciertos.filter(Boolean).map((c) => ({ id_concierto: c.id_concierto, nombre: c.nombre })),
      grupos: grupos.map((g) => ({ id_grupo: g.id_grupo, nombre: g.nombre, id_concierto: g.id_concierto })),
      reportesRecibidos: reportesCompletos.filter((r) => r.id_reportado === idUsuario),
      reportesHechos: reportesCompletos.filter((r) => r.id_reportante === idUsuario),
    };
  },

  // Suspender = vetado de toda la app; reactivar lo vuelve a dejar entrar.
  async cambiarEstadoUsuario(idModerador, idUsuario, { estado, motivo }) {
    if (idModerador === idUsuario) {
      throw ApiError.badRequest("No podés cambiar el estado de tu propia cuenta");
    }
    const usuario = await usuarioRepository.obtenerPorId(idUsuario);
    if (!usuario) throw ApiError.notFound("El usuario no existe");
    if (estado === "suspendido" && usuario.rol === "moderador") {
      throw ApiError.badRequest("No se puede suspender a otro moderador");
    }

    const actualizado = await backofficeRepository.cambiarEstadoUsuario(idUsuario, { estado, motivo });
    try {
      await backofficeRepository.banearEnAuth(idUsuario, estado === "suspendido");
    } catch (error) {
      // El estado en "usuario" ya alcanza para dejarlo afuera de la API.
      console.error(error.message);
    }
    return resumenUsuario(actualizado);
  },

  // ---------- Reportes ----------

  async listarReportes(filtros) {
    const reportes = await reporteRepository.listar(filtros);
    return completarReportes(reportes);
  },

  // El reporte con todo lo que pasó: si fue en un grupo, los últimos
  // mensajes del grupo; si no, el chat privado entre los dos.
  async detalleReporte(idReporte) {
    const reporte = await reporteRepository.obtenerPorId(idReporte);
    if (!reporte) throw ApiError.notFound("El reporte no existe");

    const [completo] = await completarReportes([reporte]);

    let filas;
    let campoAutor;
    if (reporte.id_grupo) {
      filas = await mensajeRepository.listarPorGrupo(reporte.id_grupo, { limite: MENSAJES_DE_CONTEXTO });
      campoAutor = "id_usuario";
    } else {
      filas = await mensajePrivadoRepository.listarConversacion(
        reporte.id_reportante,
        reporte.id_reportado,
        { limite: MENSAJES_DE_CONTEXTO }
      );
      campoAutor = "id_emisor";
    }
    const autores = await usuariosPorId(filas.map((m) => m[campoAutor]));

    const otrosReportes = (await reporteRepository.listarDeUsuario(reporte.id_reportado)).filter(
      (r) => r.id_reportado === reporte.id_reportado && r.id_reporte !== reporte.id_reporte
    );

    return {
      ...completo,
      contexto: {
        tipo: reporte.id_grupo ? "grupo" : "privado",
        mensajes: armarMensajes(filas, autores, campoAutor),
      },
      otrosReportesContraElUsuario: otrosReportes.length,
    };
  },

  // sancionar: suspende al usuario reportado. descartar: no pasa nada.
  async resolverReporte(idModerador, idReporte, { decision, resolucion }) {
    const reporte = await reporteRepository.obtenerPorId(idReporte);
    if (!reporte) throw ApiError.notFound("El reporte no existe");
    if (reporte.estado !== "pendiente") {
      throw ApiError.badRequest("Este reporte ya fue resuelto");
    }

    if (decision === "sancionar") {
      await backofficeService.cambiarEstadoUsuario(idModerador, reporte.id_reportado, {
        estado: "suspendido",
        motivo: resolucion || reporte.motivo,
      });
    }

    const resuelto = await reporteRepository.resolver(idReporte, {
      estado: decision === "sancionar" ? "sancionado" : "descartado",
      resolucion: resolucion || null,
      idModerador,
    });
    const [completo] = await completarReportes([resuelto]);
    return completo;
  },

  // ---------- Conciertos ----------

  async catalogo() {
    const [artistas, estadios, estilos] = await Promise.all([
      backofficeRepository.listarArtistas(),
      backofficeRepository.listarEstadios(),
      estiloMusicalRepository.listarCatalogo(),
    ]);
    return { artistas, estadios, estilos };
  },

  async listarConciertos() {
    const filas = await backofficeRepository.listarConciertos();
    return filas.map(toConciertoResumen);
  },

  // El artista se escribe por nombre: si no existe, se crea.
  async crearConcierto({ artista, ...datos }) {
    const filaArtista = await backofficeRepository.obtenerOCrearArtista(artista);
    return backofficeRepository.crearConcierto({ ...datos, id_artista: filaArtista.id_artista });
  },

  // Cambiar datos de un concierto le avisa a sus fans (si son muchos).
  async actualizarConcierto(idConcierto, { artista, ...cambios }) {
    const anterior = await conciertoRepository.obtenerPorId(idConcierto);
    if (!anterior) throw ApiError.notFound("El concierto no existe");

    if (artista) {
      const filaArtista = await backofficeRepository.obtenerOCrearArtista(artista);
      cambios.id_artista = filaArtista.id_artista;
    }

    const actualizado = await backofficeRepository.actualizarConcierto(idConcierto, cambios);
    // La fecha se compara sin segundos ("2026-08-28T21:00" vs "...T21:00:00").
    const comparable = (campo, valor) =>
      campo === "fecha" ? String(valor ?? "").slice(0, 16) : String(valor ?? "");
    const cambiados = Object.keys(cambios).filter(
      (campo) => comparable(campo, cambios[campo]) !== comparable(campo, anterior[campo])
    );

    let aviso = { notificados: 0 };
    if (cambiados.length > 0) {
      const lista = cambiados.map((c) => NOMBRES_CAMPO[c] || c).join(", ");
      aviso = await notificarFans(actualizado, {
        titulo: actualizado.nombre,
        descripcion: `Hay cambios en este concierto: se actualizó ${lista}. Entrá para ver los detalles.`,
      });
    }
    return { concierto: actualizado, cambios: cambiados, aviso };
  },

  async publicarNovedad(idConcierto, { titulo, descripcion }) {
    const concierto = await conciertoRepository.obtenerPorId(idConcierto);
    if (!concierto) throw ApiError.notFound("El concierto no existe");
    const aviso = await notificarFans(concierto, {
      titulo: `${concierto.nombre}: ${titulo}`,
      descripcion,
    });
    return { aviso };
  },

  // ---------- Grupos ----------

  async listarGrupos() {
    const filas = await backofficeRepository.listarGrupos();
    return filas.map(({ concierto, grupos_usuarios, mensaje_grupo, ...g }) => ({
      ...g,
      concierto: concierto?.nombre || "",
      cantidadIntegrantes: grupos_usuarios?.[0]?.count ?? 0,
      cantidadMensajes: mensaje_grupo?.[0]?.count ?? 0,
    }));
  },

  async mensajesDeGrupo(idGrupo) {
    const grupo = await grupoRepository.obtenerPorId(idGrupo);
    if (!grupo) throw ApiError.notFound("El grupo no existe");
    const filas = await mensajeRepository.listarPorGrupo(idGrupo, { limite: 200 });
    const autores = await usuariosPorId(filas.map((m) => m.id_usuario));
    return { grupo, mensajes: armarMensajes(filas, autores, "id_usuario") };
  },
};
