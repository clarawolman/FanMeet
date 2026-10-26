import { chatbotService } from "../services/chatbotService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const chatbotController = {
  borrarHistorial: asyncHandler(async (req, res) => {
    res.json(await chatbotService.borrarHistorial(req.user.id));
  }),

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

  resolverAccion: asyncHandler(async (req, res) => {
    const { decision, id_grupo, id_concierto, codigo } = req.body;
    const objetivo = { idGrupo: id_grupo, idConcierto: id_concierto, codigo };
    res.json(await chatbotService.resolverAccion(req.user.id, req.params.idMensaje, decision, objetivo));
  }),
};
