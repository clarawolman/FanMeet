import { Router } from "express";
import { momentoController as c } from "../controllers/momentoController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  comentarioSchema,
  editarMomentoSchema,
  idComentarioParamSchema,
  idMomentoParamSchema,
} from "../validators/momentoValidators.js";

// Momentos como publicaciones: ver, editar, me gusta, comentarios,
// guardar y fijar. Subir y listar los de un perfil están en usuarioRoutes.
const router = Router();
router.use(authMiddleware);

const id = validate(idMomentoParamSchema, "params");
const idComentario = validate(idComentarioParamSchema, "params");

// Antes de "/:idHighlight" para que "guardados" no se tome como un id
router.get("/guardados", c.listarGuardados);

router.get("/:idHighlight", id, c.obtener);
router.patch("/:idHighlight", id, validate(editarMomentoSchema), c.editar);

router.post("/:idHighlight/like", id, c.darLike);
router.delete("/:idHighlight/like", id, c.quitarLike);
router.get("/:idHighlight/likes", id, c.listarLikes);

router.post("/:idHighlight/comentarios", id, validate(comentarioSchema), c.comentar);
router.delete("/:idHighlight/comentarios/:idComentario", idComentario, c.eliminarComentario);
router.post("/:idHighlight/comentarios/:idComentario/like", idComentario, c.darLikeComentario);
router.delete("/:idHighlight/comentarios/:idComentario/like", idComentario, c.quitarLikeComentario);

router.post("/:idHighlight/guardado", id, c.guardar);
router.delete("/:idHighlight/guardado", id, c.quitarGuardado);

router.post("/:idHighlight/fijado", id, c.fijar);
router.delete("/:idHighlight/fijado", id, c.desfijar);

export default router;
