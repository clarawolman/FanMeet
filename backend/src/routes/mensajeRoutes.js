import { Router } from "express";
import { mensajeController } from "../controllers/mensajeController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { idGrupoParamSchema } from "../validators/grupoValidators.js";
import { enviarMensajeSchema, listarMensajesQuerySchema } from "../validators/mensajeValidators.js";

const router = Router();

router.get(
  "/:idGrupo/mensajes",
  authMiddleware,
  validate(idGrupoParamSchema, "params"),
  validate(listarMensajesQuerySchema, "query"),
  mensajeController.listar
);
router.post(
  "/:idGrupo/mensajes",
  authMiddleware,
  validate(idGrupoParamSchema, "params"),
  validate(enviarMensajeSchema),
  mensajeController.enviar
);

export default router;
