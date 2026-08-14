import { Router } from "express";
import { notificacionController } from "../controllers/notificacionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  marcarLeidasSchema,
  idNotificacionParamSchema,
} from "../validators/notificacionValidators.js";

const router = Router();

router.get("/", authMiddleware, notificacionController.listar);
router.get("/no-leidas/count", authMiddleware, notificacionController.contarNoLeidas);
router.patch(
  "/leidas",
  authMiddleware,
  validate(marcarLeidasSchema),
  notificacionController.marcarLeidas
);
router.delete(
  "/:idNotificacion",
  authMiddleware,
  validate(idNotificacionParamSchema, "params"),
  notificacionController.eliminar
);

export default router;
