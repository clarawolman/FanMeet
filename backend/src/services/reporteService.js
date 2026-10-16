import { reporteRepository } from "../repositories/reporteRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { enviarMail } from "../helpers/mailer.js";
import { ApiError } from "../helpers/ApiError.js";
import { env } from "../config/env.js";

export const reporteService = {
  // Un usuario reporta a otro. Si pasó en un grupo, quien reporta tiene que
  // ser miembro (así el moderador ve esa conversación); si no, el
  // moderador mira el chat privado entre los dos.
  async crear(idReportante, { idReportado, idGrupo, motivo }) {
    if (idReportante === idReportado) {
      throw ApiError.badRequest("No te podés reportar a vos mismo");
    }

    const reportado = await usuarioRepository.obtenerPorId(idReportado);
    if (!reportado) throw ApiError.notFound("El usuario no existe");

    let grupo = null;
    if (idGrupo) {
      grupo = await grupoRepository.obtenerPorId(idGrupo);
      if (!grupo) throw ApiError.notFound("El grupo no existe");
      const esMiembro = await grupoUsuarioRepository.existeRelacion(idReportante, idGrupo);
      if (!esMiembro) throw ApiError.forbidden("No pertenecés a este grupo");
    }

    const yaReportado = await reporteRepository.obtenerPendiente(idReportante, idReportado);
    if (yaReportado) {
      return { ok: true, yaReportado: true };
    }

    const reporte = await reporteRepository.crear({
      idReportante,
      idReportado,
      idGrupo: idGrupo || null,
      motivo,
    });

    const reportante = await usuarioRepository.obtenerPorId(idReportante);
    await enviarMail({
      para: env.mailModerador,
      asunto: `Nuevo reporte en FanMeet: ${reportado.nombre}`,
      texto: [
        `${reportante?.nombre || "Un usuario"} reportó a ${reportado.nombre} (${reportado.mail}).`,
        grupo ? `Dónde: grupo "${grupo.nombre}"` : "Dónde: chat privado / perfil",
        "",
        `Motivo: ${motivo}`,
        "",
        `Revisalo en el backoffice: ${env.backofficeUrl}/#reporte-${reporte.id_reporte}`,
      ].join("\n"),
    });

    return { ok: true, yaReportado: false };
  },
};
