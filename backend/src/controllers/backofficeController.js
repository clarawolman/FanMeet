import { backofficeService } from "../services/backofficeService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const backofficeController = {
  resumen: asyncHandler(async (_req, res) => {
    res.json(await backofficeService.resumen());
  }),

  listarUsuarios: asyncHandler(async (req, res) => {
    res.json(await backofficeService.listarUsuarios(req.query));
  }),

  detalleUsuario: asyncHandler(async (req, res) => {
    res.json(await backofficeService.detalleUsuario(req.params.idUsuario));
  }),

  cambiarEstadoUsuario: asyncHandler(async (req, res) => {
    res.json(
      await backofficeService.cambiarEstadoUsuario(req.user.id, req.params.idUsuario, req.body)
    );
  }),

  listarReportes: asyncHandler(async (req, res) => {
    res.json(await backofficeService.listarReportes(req.query));
  }),

  detalleReporte: asyncHandler(async (req, res) => {
    res.json(await backofficeService.detalleReporte(req.params.idReporte));
  }),

  resolverReporte: asyncHandler(async (req, res) => {
    res.json(await backofficeService.resolverReporte(req.user.id, req.params.idReporte, req.body));
  }),

  catalogo: asyncHandler(async (_req, res) => {
    res.json(await backofficeService.catalogo());
  }),

  listarConciertos: asyncHandler(async (_req, res) => {
    res.json(await backofficeService.listarConciertos());
  }),

  crearConcierto: asyncHandler(async (req, res) => {
    res.status(201).json(await backofficeService.crearConcierto(req.body));
  }),

  actualizarConcierto: asyncHandler(async (req, res) => {
    res.json(await backofficeService.actualizarConcierto(req.params.idConcierto, req.body));
  }),

  publicarNovedad: asyncHandler(async (req, res) => {
    res.status(201).json(await backofficeService.publicarNovedad(req.params.idConcierto, req.body));
  }),

  listarGrupos: asyncHandler(async (_req, res) => {
    res.json(await backofficeService.listarGrupos());
  }),

  mensajesDeGrupo: asyncHandler(async (req, res) => {
    res.json(await backofficeService.mensajesDeGrupo(req.params.idGrupo));
  }),
};
