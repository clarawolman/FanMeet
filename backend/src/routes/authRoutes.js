import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";
import {
  loginSchema,
  registroSchema,
  reenviarCodigoSchema,
  verificarCodigoSchema,
  verificarDisponibilidadSchema,
} from "../validators/authValidators.js";

const router = Router();

router.post("/login", authRateLimiter, validate(loginSchema), authController.login);
router.post(
  "/verificar-registro",
  authRateLimiter,
  validate(verificarDisponibilidadSchema),
  authController.verificarDisponibilidad
);
router.post("/registro", authRateLimiter, validate(registroSchema), authController.registro);
router.post(
  "/verificar-codigo",
  authRateLimiter,
  validate(verificarCodigoSchema),
  authController.verificarCodigo
);
router.post(
  "/reenviar-codigo",
  authRateLimiter,
  validate(reenviarCodigoSchema),
  authController.reenviarCodigo
);
router.post("/logout", authMiddleware, authController.logout);

export default router;
