import { Router } from "express";
import { backofficeController as c } from "../controllers/backofficeController.js";
import { authMiddleware, soloModerador } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  idUsuarioParamSchema,
  idReporteParamSchema,
  idConciertoParamSchema,
  idGrupoParamSchema,
  listarUsuariosQuerySchema,
  listarReportesQuerySchema,
  cambiarEstadoSchema,
  resolverReporteSchema,
  crearConciertoSchema,
  actualizarConciertoSchema,
  novedadSchema,
} from "../validators/backofficeValidators.js";

const router = Router();

// Todo el backoffice: sesión válida + rol moderador.
router.use(authMiddleware, soloModerador);

router.get("/resumen", c.resumen);

router.get("/usuarios", validate(listarUsuariosQuerySchema, "query"), c.listarUsuarios);
router.get("/usuarios/:idUsuario", validate(idUsuarioParamSchema, "params"), c.detalleUsuario);
router.patch(
  "/usuarios/:idUsuario/estado",
  validate(idUsuarioParamSchema, "params"),
  validate(cambiarEstadoSchema),
  c.cambiarEstadoUsuario
);

router.get("/reportes", validate(listarReportesQuerySchema, "query"), c.listarReportes);
router.get("/reportes/:idReporte", validate(idReporteParamSchema, "params"), c.detalleReporte);
router.patch(
  "/reportes/:idReporte",
  validate(idReporteParamSchema, "params"),
  validate(resolverReporteSchema),
  c.resolverReporte
);

router.get("/catalogo", c.catalogo);
router.get("/conciertos", c.listarConciertos);
router.post("/conciertos", validate(crearConciertoSchema), c.crearConcierto);
router.patch(
  "/conciertos/:idConcierto",
  validate(idConciertoParamSchema, "params"),
  validate(actualizarConciertoSchema),
  c.actualizarConcierto
);
router.post(
  "/conciertos/:idConcierto/novedades",
  validate(idConciertoParamSchema, "params"),
  validate(novedadSchema),
  c.publicarNovedad
);

router.get("/grupos", c.listarGrupos);
router.get("/grupos/:idGrupo/mensajes", validate(idGrupoParamSchema, "params"), c.mensajesDeGrupo);

export default router;
