import { Router } from "express";
import { conciertoController } from "../controllers/conciertoController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  idConciertoParamSchema,
  unirseConciertoSchema,
} from "../validators/conciertoValidators.js";

const router = Router();

router.get("/", authMiddleware, conciertoController.listar);
router.get("/mis-eventos", authMiddleware, conciertoController.listarMisEventos);
router.get(
  "/:idConcierto",
  authMiddleware,
  validate(idConciertoParamSchema, "params"),
  conciertoController.obtenerDetalle
);
router.post(
  "/:idConcierto/unirse",
  authMiddleware,
  validate(idConciertoParamSchema, "params"),
  validate(unirseConciertoSchema),
  conciertoController.unirse
);
router.delete(
  "/:idConcierto/salir",
  authMiddleware,
  validate(idConciertoParamSchema, "params"),
  conciertoController.salir
);

export default router;
