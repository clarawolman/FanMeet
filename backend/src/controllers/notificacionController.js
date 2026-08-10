import { notificacionService } from "../services/notificacionService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const notificacionController = {
  listar: asyncHandler(async (req, res) => {
    const notificaciones = await notificacionService.listar(req.user.id);
    res.json(notificaciones);
  }),

  contarNoLeidas: asyncHandler(async (req, res) => {
    const count = await notificacionService.contarNoLeidas(req.user.id);
    res.json({ count });
  }),

  marcarLeidas: asyncHandler(async (req, res) => {
    const notificaciones = await notificacionService.marcarLeidas(req.user.id, req.body.ids);
    res.json(notificaciones);
  }),

  eliminar: asyncHandler(async (req, res) => {
    const resultado = await notificacionService.eliminar(req.user.id, req.params.idNotificacion);
    res.json(resultado);
  }),
};
