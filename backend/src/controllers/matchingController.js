import { matchingService } from "../services/matchingService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const matchingController = {
  compatibilidad: asyncHandler(async (req, res) => {
    res.json(await matchingService.compatibilidad(req.user.id, req.params.idUsuario));
  }),

  descubrir: asyncHandler(async (req, res) => {
    res.json(await matchingService.descubrir(req.user.id));
  }),

  recomendarConciertos: asyncHandler(async (req, res) => {
    res.json(await matchingService.recomendarConciertos(req.user.id));
  }),
};
