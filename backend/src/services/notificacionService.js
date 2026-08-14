import { notificacionRepository } from "../repositories/notificacionRepository.js";
import { toNotificacion } from "../entities/Notificacion.js";
import { ApiError } from "../helpers/ApiError.js";

export const notificacionService = {
  // Usada internamente por conciertoService/grupoService al unirse a un
  // concierto/grupo (mismo disparador que hoy tiene notificaciones.js).
  async crear({ idUsuario, tipo, titulo, descripcion, imagen, idConcierto, idGrupo }) {
    await notificacionRepository.crear({
      id_usuario: idUsuario,
      tipo,
      titulo,
      descripcion,
      imagen,
      id_concierto: idConcierto,
      id_grupo: idGrupo,
    });
  },

  // Mismo comportamiento que Notificaciones.jsx: se marcan como leidas
  // apenas se listan.
  async listar(idUsuario) {
    const filas = await notificacionRepository.listarPorUsuario(idUsuario);
    const idsSinLeer = filas.filter((n) => !n.leida).map((n) => n.id_notificacion);

    if (idsSinLeer.length > 0) {
      await notificacionRepository.marcarLeidas(idUsuario, idsSinLeer);
    }

    return filas.map(toNotificacion);
  },

  async contarNoLeidas(idUsuario) {
    return notificacionRepository.contarNoLeidas(idUsuario);
  },

  // idUsuarioAutenticado siempre viaja en el filtro del repository: cierra
  // el hallazgo donde el UPDATE solo filtraba por id_notificacion.
  async marcarLeidas(idUsuarioAutenticado, ids) {
    const actualizadas = await notificacionRepository.marcarLeidas(idUsuarioAutenticado, ids);
    return actualizadas.map(toNotificacion);
  },

  async eliminar(idUsuarioAutenticado, idNotificacion) {
    const eliminadas = await notificacionRepository.eliminar(idUsuarioAutenticado, idNotificacion);
    if (!eliminadas || eliminadas.length === 0) {
      throw ApiError.notFound("La notificación no existe");
    }
    return { ok: true };
  },
};
