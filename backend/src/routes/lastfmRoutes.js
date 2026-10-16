import { Router } from "express";
import { lastfmController } from "../controllers/lastfmController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { idUsuarioParamSchema } from "../validators/usuarioValidators.js";
import { vincularLastfmSchema, autorizarLastfmSchema } from "../validators/lastfmValidators.js";

const router = Router();

// Vinculacion en dos pasos: el popup pasa por /autorizar (inicia sesion en
// Last.fm y aprueba) y despues el perfil manda el token a PUT /me.
router.get("/autorizar", validate(autorizarLastfmSchema, "query"), lastfmController.autorizar);
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
  lastfmController.obtenerEscuchas
);

export default router;
