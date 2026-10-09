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

  obtenerResumen: asyncHandler(async (req, res) => {
    res.json(await lastfmService.obtenerResumen(req.params.idUsuario));
  }),

  obtenerSugerencias: asyncHandler(async (req, res) => {
    res.json(await lastfmService.obtenerSugerencias(req.user.id));
  }),

  obtenerEscuchas: asyncHandler(async (req, res) => {
    const escuchas = await lastfmService.obtenerEscuchas(req.params.idUsuario, req.query.periodo);
    res.json(escuchas);
  }),
};
