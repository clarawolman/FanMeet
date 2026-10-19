import { bloqueoService } from "../services/bloqueoService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const bloqueoController = {
  listar: asyncHandler(async (req, res) => {
    res.json(await bloqueoService.listarBloqueados(req.user.id));
  }),

  bloquear: asyncHandler(async (req, res) => {
    res.status(201).json(await bloqueoService.bloquear(req.user.id, req.body.id_usuario));
  }),

  desbloquear: asyncHandler(async (req, res) => {
    res.json(await bloqueoService.desbloquear(req.user.id, req.params.idUsuario));
  }),
};
