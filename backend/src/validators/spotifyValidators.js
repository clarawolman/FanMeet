import { z } from "zod";

// Los ids de Spotify son base62 de 22 caracteres.
const spotifyId = z.string().regex(/^[A-Za-z0-9]{22}$/, "id de Spotify inválido");

export const busquedaSpotifySchema = z.object({
  q: z.string().trim().min(1, "Escribí algo para buscar").max(100),
  tipo: z.enum(["artista", "album", "cancion"]).default("artista"),
});

export const agregarFavoritoSchema = z.object({
  spotify_id: spotifyId,
});

export const spotifyIdParamSchema = z.object({
  spotifyId,
});
