import { Router } from "express";
import { grupoController } from "../controllers/grupoController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { crearGrupoSchema, actualizarGrupoSchema, idGrupoParamSchema } from "../validators/grupoValidators.js";

const router = Router();

router.post("/", authMiddleware, validate(crearGrupoSchema), grupoController.crear);
router.get("/mios", authMiddleware, grupoController.listarMisGrupos);
router.get(
  "/:idGrupo",
  authMiddleware,
  validate(idGrupoParamSchema, "params"),
  grupoController.obtenerDetalle
);
router.post(
  "/:idGrupo/unirse",
  authMiddleware,
  validate(idGrupoParamSchema, "params"),
  grupoController.unirse
);
router.delete(
  "/:idGrupo/salir",
  authMiddleware,
  validate(idGrupoParamSchema, "params"),
  grupoController.salir
);
router.patch(
  "/:idGrupo",
  authMiddleware,
  validate(idGrupoParamSchema, "params"),
  validate(actualizarGrupoSchema),
  grupoController.actualizar
);
router.delete(
  "/:idGrupo",
  authMiddleware,
  validate(idGrupoParamSchema, "params"),
  grupoController.eliminar
);

export default router;
