import { Router } from "express";
import { lastfmController } from "../controllers/lastfmController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { idUsuarioParamSchema } from "../validators/usuarioValidators.js";
import { vincularLastfmSchema, escuchasQuerySchema } from "../validators/lastfmValidators.js";

const router = Router();

router.put("/me", authMiddleware, validate(vincularLastfmSchema), lastfmController.vincular);
router.delete("/me", authMiddleware, lastfmController.desvincular);
router.get("/me/sugerencias", authMiddleware, lastfmController.obtenerSugerencias);

router.get(
  "/usuarios/:idUsuario/resumen",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  lastfmController.obtenerResumen
);

router.get(
  "/usuarios/:idUsuario/escuchas",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  validate(escuchasQuerySchema, "query"),
  lastfmController.obtenerEscuchas
);

export default router;
