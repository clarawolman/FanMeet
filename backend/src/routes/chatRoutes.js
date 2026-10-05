import { Router } from "express";
import { chatController } from "../controllers/chatController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { upload } from "../middlewares/upload.js";
import { idUsuarioParamSchema } from "../validators/usuarioValidators.js";
import { idGrupoParamSchema } from "../validators/grupoValidators.js";
import {
  enviarMensajePrivadoSchema,
  listarMensajesPrivadosQuerySchema,
} from "../validators/chatValidators.js";

const router = Router();

router.get("/", authMiddleware, chatController.listarChats);
router.get("/no-leidos", authMiddleware, chatController.contarNoLeidos);
// Los mensajes del chat de grupo se leen/envían por /grupos/:idGrupo/mensajes
// (mensajeRoutes.js); acá solo se marca el chat como leído.
router.patch(
  "/grupos/:idGrupo/leidos",
  authMiddleware,
  validate(idGrupoParamSchema, "params"),
  chatController.marcarGrupoLeido
);
router.get(
  "/:idUsuario/mensajes",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  validate(listarMensajesPrivadosQuerySchema, "query"),
  chatController.listarMensajes
);
router.post(
  "/:idUsuario/mensajes",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  upload.single("imagen"),
  validate(enviarMensajePrivadoSchema),
  chatController.enviar
);
router.patch(
  "/:idUsuario/leidos",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  chatController.marcarLeidos
);

export default router;
