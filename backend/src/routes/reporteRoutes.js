import { Router } from "express";
import { reporteController } from "../controllers/reporteController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { reporteRateLimiter } from "../middlewares/rateLimiter.js";
import { crearReporteSchema } from "../validators/reporteValidators.js";

const router = Router();

router.post("/", authMiddleware, reporteRateLimiter, validate(crearReporteSchema), reporteController.crear);

export default router;
