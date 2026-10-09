import { env } from "../config/env.js";
import { spotifyApiRepository } from "../repositories/spotifyApiRepository.js";
import { artistaFavoritoRepository } from "../repositories/artistaFavoritoRepository.js";
import {
  toArtistaSpotify,
  toAlbumSpotify,
  toCancionSpotify,
  toArtistaFavorito,
} from "../entities/Spotify.js";
import { ApiError } from "../helpers/ApiError.js";

const MAX_FAVORITOS = 20;
const BUSQUEDA_LIMITE = 10;

const TIPOS_BUSQUEDA = {
  artista: { tipo: "artist", clave: "artists", mapear: toArtistaSpotify },
  album: { tipo: "album", clave: "albums", mapear: toAlbumSpotify },
  cancion: { tipo: "track", clave: "tracks", mapear: toCancionSpotify },
};

// Token de la app (dura 1 hora) y fotos ya buscadas. Viven en memoria: si
// el server se reinicia se vuelven a pedir, sin drama.
let tokenApp = null;
const cacheImagenes = new Map();

export function spotifyConfigurado() {
  return Boolean(env.spotifyClientId && env.spotifyClientSecret);
}

function asegurarConfigurado() {
  if (!spotifyConfigurado()) {
    throw new ApiError(503, "La búsqueda de artistas no está configurada en el servidor.");
  }
}

async function obtenerTokenApp() {
  if (tokenApp && tokenApp.expira > Date.now()) return tokenApp.token;
  const datos = await spotifyApiRepository.tokenDeApp();
  // Margen de 60s para no usar un token que vence en medio de la request.
  tokenApp = { token: datos.access_token, expira: Date.now() + (datos.expires_in - 60) * 1000 };
  return tokenApp.token;
}

export const spotifyService = {
  // Busqueda sobre TODO el catalogo de Spotify (artistas, albumes o canciones).
  async buscar(texto, tipo = "artista") {
    asegurarConfigurado();
    const config = TIPOS_BUSQUEDA[tipo];
    if (!config) throw ApiError.badRequest("Tipo de búsqueda inválido");

    const token = await obtenerTokenApp();
    const datos = await spotifyApiRepository.buscar(token, texto, config.tipo, BUSQUEDA_LIMITE);
    return (datos?.[config.clave]?.items || []).filter(Boolean).map(config.mapear);
  },

  // Last.fm ya no da fotos de artistas ni de muchas canciones: las buscamos
  // en Spotify por nombre. Nunca falla: si no encuentra nada devuelve null
  // y el frontend muestra la inicial.
  async buscarImagen(tipo, nombre, artista) {
    if (!spotifyConfigurado() || !nombre) return null;

    const clave = `${tipo}|${nombre}|${artista || ""}`.toLowerCase();
    if (cacheImagenes.has(clave)) return cacheImagenes.get(clave);

    try {
      const token = await obtenerTokenApp();
      const consulta =
        tipo === "artista" ? `artist:${nombre}` : `track:${nombre} artist:${artista || ""}`;
      const tipoSpotify = tipo === "artista" ? "artist" : "track";
      const datos = await spotifyApiRepository.buscar(token, consulta, tipoSpotify, 1);
      const item = datos?.[`${tipoSpotify}s`]?.items?.[0];
      const mapeado = tipo === "artista" ? toArtistaSpotify(item) : toCancionSpotify(item);
      const imagen = mapeado?.imagen || null;
      cacheImagenes.set(clave, imagen);
      return imagen;
    } catch (error) {
      console.error("No se pudo buscar imagen en Spotify:", error.message);
      return null;
    }
  },

  async listarFavoritos(idUsuario) {
    const filas = await artistaFavoritoRepository.listarPorUsuario(idUsuario);
    return filas.map(toArtistaFavorito);
  },

  // Solo se recibe el id: nombre e imagen salen de Spotify, nunca del
  // cliente, asi nadie puede guardar un "artista" con datos inventados.
  async agregarFavorito(idUsuarioAutenticado, spotifyId) {
    asegurarConfigurado();

    const existentes = await artistaFavoritoRepository.listarPorUsuario(idUsuarioAutenticado);
    const yaEsta = existentes.find((fila) => fila.spotify_id === spotifyId);
    if (yaEsta) return toArtistaFavorito(yaEsta);
    if (existentes.length >= MAX_FAVORITOS) {
      throw ApiError.badRequest(`Podés tener hasta ${MAX_FAVORITOS} artistas favoritos`);
    }

    const token = await obtenerTokenApp();
    const artista = toArtistaSpotify(await spotifyApiRepository.obtenerArtista(token, spotifyId));
    const fila = await artistaFavoritoRepository.crear(idUsuarioAutenticado, artista);
    return toArtistaFavorito(fila);
  },

  async quitarFavorito(idUsuarioAutenticado, spotifyId) {
    await artistaFavoritoRepository.eliminar(idUsuarioAutenticado, spotifyId);
  },
};
