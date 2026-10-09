import { Router } from "express";
import { matchingController } from "../controllers/matchingController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { idUsuarioParamSchema } from "../validators/usuarioValidators.js";

const router = Router();

router.get("/me/descubrir", authMiddleware, matchingController.descubrir);
router.get("/me/conciertos", authMiddleware, matchingController.recomendarConciertos);
router.get(
  "/usuarios/:idUsuario",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  matchingController.compatibilidad
);

export default router;
