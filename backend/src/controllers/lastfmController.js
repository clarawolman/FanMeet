import { lastfmService } from "../services/lastfmService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const lastfmController = {
  // Se abre en un popup (navegacion comun, sin token de FanMeet): solo
  // redirige a la pantalla de Last.fm para iniciar sesion y aprobar.
  autorizar: asyncHandler(async (req, res) => {
    res.redirect(lastfmService.urlAutorizacion(req.query.origen));
  }),

  vincular: asyncHandler(async (req, res) => {
    const cuenta = await lastfmService.vincular(req.user.id, req.body.token);
    res.json(cuenta);
  }),

  desvincular: asyncHandler(async (req, res) => {
    await lastfmService.desvincular(req.user.id);
    res.status(204).end();
  }),

  obtenerResumen: asyncHandler(async (req, res) => {
    res.json(await lastfmService.obtenerResumen(req.params.idUsuario, req.user.id));
  }),

  obtenerSugerencias: asyncHandler(async (req, res) => {
    res.json(await lastfmService.obtenerSugerencias(req.user.id));
  }),

  obtenerEscuchas: asyncHandler(async (req, res) => {
    const escuchas = await lastfmService.obtenerEscuchas(req.params.idUsuario, req.user.id);
    res.json(escuchas);
  }),
};
