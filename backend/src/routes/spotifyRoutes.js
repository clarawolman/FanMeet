import { Router } from "express";
import { spotifyController } from "../controllers/spotifyController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { idUsuarioParamSchema } from "../validators/usuarioValidators.js";
import {
  busquedaSpotifySchema,
  agregarFavoritoSchema,
  spotifyIdParamSchema,
} from "../validators/spotifyValidators.js";

const router = Router();

// Sin login: el registro (paso 3) tambien busca artistas favoritos. Es solo
// el catalogo publico de Spotify, con el token de la app.
router.get(
  "/buscar",
  validate(busquedaSpotifySchema, "query"),
  spotifyController.buscar
);

router.post(
  "/me/favoritos",
  authMiddleware,
  validate(agregarFavoritoSchema),
  spotifyController.agregarFavorito
);
router.delete(
  "/me/favoritos/:spotifyId",
  authMiddleware,
  validate(spotifyIdParamSchema, "params"),
  spotifyController.quitarFavorito
);

router.get(
  "/usuarios/:idUsuario/favoritos",
  authMiddleware,
  validate(idUsuarioParamSchema, "params"),
  spotifyController.listarFavoritos
);

export default router;
