import { amistadService } from "../services/amistadService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const amistadController = {
  obtenerEstado: asyncHandler(async (req, res) => {
    const estado = await amistadService.obtenerEstado(req.user.id, req.params.idUsuario);
    res.json(estado);
  }),

  crear: asyncHandler(async (req, res) => {
    const amistad = await amistadService.crearSolicitud(req.user.id, req.body.id_receptor);
    res.status(201).json(amistad);
  }),

  aceptar: asyncHandler(async (req, res) => {
    const amistad = await amistadService.aceptar(req.user.id, req.params.idAmistad);
    res.json(amistad);
  }),

  rechazarOEliminar: asyncHandler(async (req, res) => {
    const resultado = await amistadService.rechazarOEliminar(req.user.id, req.params.idAmistad);
    res.json(resultado);
  }),

  listarAmigos: asyncHandler(async (req, res) => {
    const amigos = await amistadService.listarAmigos(req.params.idUsuario);
    res.json(amigos);
  }),
};
