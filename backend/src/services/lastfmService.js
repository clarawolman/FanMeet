import { env } from "../config/env.js";
import { lastfmApiRepository, lastfmCuentaRepository } from "../repositories/lastfmRepository.js";
import { spotifyService } from "./spotifyService.js";
import {
  comoLista,
  toArtistaLastfm,
  toCancionLastfm,
  toAlbumLastfm,
  toEscuchaReciente,
} from "../entities/Lastfm.js";
import { ApiError } from "../helpers/ApiError.js";

const TOP_LIMITE = 10;
const RECIENTES_LIMITE = 10;
// Last.fm pide no consultarlo de mas: guardamos cada respuesta un minuto.
const CACHE_MS = 60 * 1000;

// Los mismos periodos que ofrece la web de Last.fm.
const PERIODOS = {
  semana: "7day",
  mes: "1month",
  trimestre: "3month",
  semestre: "6month",
  anio: "12month",
  siempre: "overall",
};

const cacheEscuchas = new Map();

function asegurarConfigurado() {
  if (!env.lastfmApiKey) {
    throw new ApiError(503, "La integración con Last.fm no está configurada en el servidor.");
  }
}

// Completa con fotos de Spotify lo que Last.fm devuelve sin imagen.
async function completarImagenes(items, tipo) {
  return Promise.all(
    items.map(async (item) =>
      item.imagen
        ? item
        : { ...item, imagen: await spotifyService.buscarImagen(tipo, item.nombre, item.artistas?.[0]) }
    )
  );
}

export const lastfmService = {
  // Verifica que el usuario exista en Last.fm antes de guardarlo, y guarda
  // el nombre tal cual lo tiene Last.fm (con sus mayusculas).
  async vincular(idUsuarioAutenticado, usuarioLastfm) {
    asegurarConfigurado();
    const info = await lastfmApiRepository.obtenerInfoUsuario(usuarioLastfm);
    const nombre = info?.user?.name || usuarioLastfm;
    await lastfmCuentaRepository.guardar(idUsuarioAutenticado, nombre);
    this.limpiarCache(idUsuarioAutenticado);
    return { usuario_lastfm: nombre };
  },

  async desvincular(idUsuarioAutenticado) {
    await lastfmCuentaRepository.eliminar(idUsuarioAutenticado);
    this.limpiarCache(idUsuarioAutenticado);
  },

  limpiarCache(idUsuario) {
    for (const clave of cacheEscuchas.keys()) {
      if (clave.startsWith(`${idUsuario}|`)) cacheEscuchas.delete(clave);
    }
  },

  // Lo que escucha un usuario (propio o ajeno), estilo Last.fm.
  async obtenerEscuchas(idUsuario, periodo = "mes") {
    const cuenta = await lastfmCuentaRepository.obtenerPorUsuario(idUsuario);
    if (!cuenta) return { conectado: false };

    asegurarConfigurado();
    const periodoLastfm = PERIODOS[periodo] || PERIODOS.mes;
    const claveCache = `${idUsuario}|${cuenta.usuario_lastfm}|${periodoLastfm}`;
    const cacheado = cacheEscuchas.get(claveCache);
    if (cacheado && cacheado.expira > Date.now()) return cacheado.datos;

    const usuario = cuenta.usuario_lastfm;
    const [artistas, canciones, albumes, recientes] = await Promise.all([
      lastfmApiRepository.obtenerTopArtistas(usuario, periodoLastfm, TOP_LIMITE),
      lastfmApiRepository.obtenerTopCanciones(usuario, periodoLastfm, TOP_LIMITE),
      lastfmApiRepository.obtenerTopAlbumes(usuario, periodoLastfm, TOP_LIMITE),
      lastfmApiRepository.obtenerRecientes(usuario, RECIENTES_LIMITE),
    ]);

    // getRecentTracks puede devolver 11 items: el "sonando ahora" va aparte.
    const listaRecientes = comoLista(recientes?.recenttracks?.track)
      .map(toEscuchaReciente)
      .slice(0, RECIENTES_LIMITE);

    const [topArtistas, topCanciones] = await Promise.all([
      completarImagenes(comoLista(artistas?.topartists?.artist).map(toArtistaLastfm), "artista"),
      completarImagenes(comoLista(canciones?.toptracks?.track).map(toCancionLastfm), "cancion"),
    ]);

    const datos = {
      conectado: true,
      usuario_lastfm: usuario,
      url_perfil: `https://www.last.fm/user/${encodeURIComponent(usuario)}`,
      periodo,
      total_reproducciones: Number(recientes?.recenttracks?.["@attr"]?.total) || 0,
      topArtistas,
      topCanciones,
      topAlbumes: comoLista(albumes?.topalbums?.album).map(toAlbumLastfm),
      recientes: await completarImagenes(listaRecientes, "cancion"),
    };

    cacheEscuchas.set(claveCache, { datos, expira: Date.now() + CACHE_MS });
    return datos;
  },
};
