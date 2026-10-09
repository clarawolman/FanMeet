import { chatbotService } from "../services/chatbotService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const chatbotController = {
  listarMensajes: asyncHandler(async (req, res) => {
    const mensajes = await chatbotService.listarMensajes(req.user.id, {
      limite: req.query.limite,
      antesDeId: req.query.antes_de,
    });
    res.json(mensajes);
  }),

  enviar: asyncHandler(async (req, res) => {
    const resultado = await chatbotService.enviar(req.user.id, req.body.contenido);
    res.status(201).json(resultado);
  }),
};
