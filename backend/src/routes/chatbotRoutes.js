import { Router } from "express";
import { chatbotController } from "../controllers/chatbotController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { chatbotRateLimiter } from "../middlewares/rateLimiter.js";
import { enviarMensajeSchema, listarMensajesQuerySchema } from "../validators/mensajeValidators.js";

const router = Router();

router.get(
  "/mensajes",
  authMiddleware,
  validate(listarMensajesQuerySchema, "query"),
  chatbotController.listarMensajes
);
router.post(
  "/mensajes",
  authMiddleware,
  chatbotRateLimiter,
  validate(enviarMensajeSchema),
  chatbotController.enviar
);

export default router;
