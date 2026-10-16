import { reporteService } from "../services/reporteService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const reporteController = {
  crear: asyncHandler(async (req, res) => {
    const resultado = await reporteService.crear(req.user.id, req.body);
    res.status(201).json(resultado);
  }),
};
