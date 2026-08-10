import { Router } from "express";
import { amistadController } from "../controllers/amistadController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { crearAmistadSchema, idAmistadParamSchema } from "../validators/amistadValidators.js";
import { idUsuarioParamSchema } from "../validators/usuarioValidators.js";

const router = Router();

router.post("/", authMiddleware, validate(crearAmistadSchema), amistadController.crear);
router.get(
  "/estado/:idUsuario",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  amistadController.obtenerEstado
);
router.get(
  "/amigos/:idUsuario",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  amistadController.listarAmigos
);
router.patch(
  "/:idAmistad/aceptar",
  authMiddleware,
  validate(idAmistadParamSchema, "params"),
  amistadController.aceptar
);
router.delete(
  "/:idAmistad",
  authMiddleware,
  validate(idAmistadParamSchema, "params"),
  amistadController.rechazarOEliminar
);

export default router;
