import { Router } from "express";
import { usuarioController } from "../controllers/usuarioController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { upload } from "../middlewares/upload.js";
import {
  vibraSchema,
  generosSchema,
  idUsuarioParamSchema,
} from "../validators/usuarioValidators.js";

const router = Router();

router.get("/generos/catalogo", usuarioController.obtenerCatalogoGeneros);

router.get("/me", authMiddleware, usuarioController.obtenerMiPerfil);
router.get("/me/generos", authMiddleware, usuarioController.obtenerMisGeneros);
router.put(
  "/me/generos",
  authMiddleware,
  validate(generosSchema),
  usuarioController.guardarMisGeneros
);
router.patch(
  "/me/vibra",
  authMiddleware,
  validate(vibraSchema),
  usuarioController.actualizarVibra
);
router.post(
  "/me/foto",
  authMiddleware,
  upload.single("foto"),
  usuarioController.actualizarFoto
);
router.post(
  "/me/highlights",
  authMiddleware,
  upload.single("highlight"),
  usuarioController.subirHighlight
);

router.get(
  "/:idUsuario",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  usuarioController.obtenerPerfil
);
router.get(
  "/:idUsuario/highlights",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  usuarioController.listarHighlights
);
router.get(
  "/:idUsuario/estadisticas",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  usuarioController.obtenerEstadisticas
);
router.get(
  "/:idUsuario/generos",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  usuarioController.obtenerGenerosDeUsuario
);

export default router;
