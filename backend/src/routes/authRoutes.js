import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";
import {
  loginSchema,
  registroSchema,
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
router.post("/logout", authMiddleware, authController.logout);

export default router;
