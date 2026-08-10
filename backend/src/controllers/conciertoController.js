import { conciertoService } from "../services/conciertoService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const conciertoController = {
  listar: asyncHandler(async (_req, res) => {
    const conciertos = await conciertoService.listar();
    res.json(conciertos);
  }),

  obtenerDetalle: asyncHandler(async (req, res) => {
    const concierto = await conciertoService.obtenerDetalle(req.params.idConcierto);
    res.json(concierto);
  }),

  unirse: asyncHandler(async (req, res) => {
    const resultado = await conciertoService.unirsePorCodigo(
      req.user.id,
      req.params.idConcierto,
      req.body.codigo
    );
    res.json(resultado);
  }),

  listarMisEventos: asyncHandler(async (req, res) => {
    const eventos = await conciertoService.listarMisEventos(req.user.id);
    res.json(eventos);
  }),

  salir: asyncHandler(async (req, res) => {
    const resultado = await conciertoService.salirDeConcierto(req.user.id, req.params.idConcierto);
    res.json(resultado);
  }),
};
