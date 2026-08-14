import { amistadRepository } from "../repositories/amistadRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { toAmistad, calcularEstadoAmistad } from "../entities/Amistad.js";
import { toUsuarioPublico } from "../entities/Usuario.js";
import { ApiError } from "../helpers/ApiError.js";

export const amistadService = {
  async obtenerEstado(idUsuarioActual, idUsuarioPerfil) {
    const fila = await amistadRepository.buscarEntreUsuarios(idUsuarioActual, idUsuarioPerfil);
    return {
      idAmistad: fila?.id_amistad ?? null,
      estado: calcularEstadoAmistad(fila, idUsuarioActual),
    };
  },

  async crearSolicitud(idSolicitante, idReceptor) {
    if (idSolicitante === idReceptor) {
      throw ApiError.badRequest("No podés enviarte una solicitud a vos mismo");
    }

    const existente = await amistadRepository.buscarEntreUsuarios(idSolicitante, idReceptor);
    if (existente) {
      throw ApiError.badRequest("Ya existe una relación con este usuario");
    }

    const fila = await amistadRepository.crear(idSolicitante, idReceptor);
    return toAmistad(fila);
  },

  // Solo el receptor de la solicitud puede aceptarla: antes `perfil.jsx` y
  // `Notificaciones.jsx` solo filtraban el UPDATE por id_amistad.
  async aceptar(idUsuarioAutenticado, idAmistad) {
    const amistad = await amistadRepository.obtenerPorId(idAmistad);
    if (!amistad) throw ApiError.notFound("La solicitud de amistad no existe");

    if (amistad.id_receptor !== idUsuarioAutenticado) {
      throw ApiError.forbidden("Solo quien recibió la solicitud puede aceptarla");
    }

    const actualizada = await amistadRepository.actualizarEstado(idAmistad, "aceptada");
    return toAmistad(actualizada);
  },

  // Rechazar una solicitud pendiente o eliminar una amistad ya aceptada:
  // solo alguna de las dos partes de la relación puede hacerlo.
  async rechazarOEliminar(idUsuarioAutenticado, idAmistad) {
    const amistad = await amistadRepository.obtenerPorId(idAmistad);
    if (!amistad) throw ApiError.notFound("La amistad no existe");

    if (amistad.id_solicitante !== idUsuarioAutenticado && amistad.id_receptor !== idUsuarioAutenticado) {
      throw ApiError.forbidden("No podés modificar esta relación");
    }

    await amistadRepository.eliminar(idAmistad);
    return { ok: true };
  },

  // listaAmigosPerfil.jsx solo lee id_usuario/nombre/fotoperfil, así que se
  // devuelve la forma pública (sin mail/fechanac). Antes se devolvía la fila
  // completa; se corrigió por la auditoría de seguridad.
  async listarAmigos(idUsuario) {
    const relaciones = await amistadRepository.listarAceptadasDeUsuario(idUsuario);
    const idsAmigos = relaciones.map((r) =>
      r.id_solicitante === idUsuario ? r.id_receptor : r.id_solicitante
    );

    if (idsAmigos.length === 0) return [];
    const filas = await usuarioRepository.listarPorIds(idsAmigos);
    return filas.map(toUsuarioPublico);
  },
};
