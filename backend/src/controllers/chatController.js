import { chatService } from "../services/chatService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const chatController = {
  listarChats: asyncHandler(async (req, res) => {
    res.json(await chatService.listarChats(req.user.id));
  }),

  contarNoLeidos: asyncHandler(async (req, res) => {
    res.json(await chatService.contarNoLeidos(req.user.id));
  }),

  listarMensajes: asyncHandler(async (req, res) => {
    const mensajes = await chatService.listarMensajes(req.user.id, req.params.idUsuario, {
      limite: req.query.limite,
      antesDeId: req.query.antes_de,
    });
    res.json(mensajes);
  }),

  enviar: asyncHandler(async (req, res) => {
    const mensaje = await chatService.enviar(req.user.id, req.params.idUsuario, {
      contenido: req.body.contenido,
      archivo: req.file,
    });
    res.status(201).json(mensaje);
  }),

  marcarGrupoLeido: asyncHandler(async (req, res) => {
    res.json(await chatService.marcarGrupoLeido(req.user.id, req.params.idGrupo));
  }),

  marcarLeidos: asyncHandler(async (req, res) => {
    res.json(await chatService.marcarLeidos(req.user.id, req.params.idUsuario));
  }),
};
