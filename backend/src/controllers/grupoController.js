import { grupoService } from "../services/grupoService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const grupoController = {
  crear: asyncHandler(async (req, res) => {
    const grupo = await grupoService.crear(req.user.id, req.body);
    res.status(201).json(grupo);
  }),

  obtenerDetalle: asyncHandler(async (req, res) => {
    const grupo = await grupoService.obtenerDetalle(req.params.idGrupo);
    res.json(grupo);
  }),

  listarMisGrupos: asyncHandler(async (req, res) => {
    const grupos = await grupoService.listarMisGrupos(req.user.id);
    res.json(grupos);
  }),

  unirse: asyncHandler(async (req, res) => {
    const resultado = await grupoService.unirse(req.user.id, req.params.idGrupo);
    res.json(resultado);
  }),

  salir: asyncHandler(async (req, res) => {
    const resultado = await grupoService.salir(req.user.id, req.params.idGrupo);
    res.json(resultado);
  }),

  eliminar: asyncHandler(async (req, res) => {
    const resultado = await grupoService.eliminar(req.user.id, req.params.idGrupo);
    res.json(resultado);
  }),
};
