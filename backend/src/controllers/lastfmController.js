import { lastfmService } from "../services/lastfmService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const lastfmController = {
  vincular: asyncHandler(async (req, res) => {
    const cuenta = await lastfmService.vincular(req.user.id, req.body.usuario_lastfm);
    res.json(cuenta);
  }),

  desvincular: asyncHandler(async (req, res) => {
    await lastfmService.desvincular(req.user.id);
    res.status(204).end();
  }),

  obtenerEscuchas: asyncHandler(async (req, res) => {
    const escuchas = await lastfmService.obtenerEscuchas(req.params.idUsuario, req.query.periodo);
    res.json(escuchas);
  }),
};
