import { spotifyService } from "../services/spotifyService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const spotifyController = {
  buscar: asyncHandler(async (req, res) => {
    const resultados = await spotifyService.buscar(req.query.q, req.query.tipo);
    res.json(resultados);
  }),

  listarFavoritos: asyncHandler(async (req, res) => {
    const favoritos = await spotifyService.listarFavoritos(req.params.idUsuario);
    res.json(favoritos);
  }),

  agregarFavorito: asyncHandler(async (req, res) => {
    const favorito = await spotifyService.agregarFavorito(req.user.id, req.body.spotify_id);
    res.status(201).json(favorito);
  }),

  quitarFavorito: asyncHandler(async (req, res) => {
    await spotifyService.quitarFavorito(req.user.id, req.params.spotifyId);
    res.status(204).end();
  }),
};
