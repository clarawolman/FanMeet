import { Router } from "express";
import { bloqueoController } from "../controllers/bloqueoController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { bloquearSchema } from "../validators/bloqueoValidators.js";
import { idUsuarioParamSchema } from "../validators/usuarioValidators.js";

const router = Router();

router.get("/", authMiddleware, bloqueoController.listar);
router.post("/", authMiddleware, validate(bloquearSchema), bloqueoController.bloquear);
router.delete(
  "/:idUsuario",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  bloqueoController.desbloquear
);

export default router;
