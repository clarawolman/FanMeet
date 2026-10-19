import { mensajeService } from "../services/mensajeService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const mensajeController = {
  listar: asyncHandler(async (req, res) => {
    const mensajes = await mensajeService.listar(req.user.id, req.params.idGrupo, {
      limite: req.query.limite,
      antesDeId: req.query.antes_de,
    });
    res.json(mensajes);
  }),

  enviar: asyncHandler(async (req, res) => {
    const mensaje = await mensajeService.enviar(req.user.id, req.params.idGrupo, {
      contenido: req.body.contenido,
      archivo: req.file,
    });
    res.status(201).json(mensaje);
  }),
};
