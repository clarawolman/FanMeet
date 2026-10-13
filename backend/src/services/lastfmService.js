import { env } from "../config/env.js";
import { lastfmApiRepository, lastfmCuentaRepository } from "../repositories/lastfmRepository.js";
import { spotifyService } from "./spotifyService.js";
import { generosPrincipales } from "./matchingService.js";
import { artistaFavoritoRepository } from "../repositories/artistaFavoritoRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { normalizarGenero } from "../helpers/generos.js";
import {
  comoLista,
  toArtistaLastfm,
  toCancionLastfm,
  toAlbumLastfm,
  toEscuchaReciente,
} from "../entities/Lastfm.js";
import { ApiError } from "../helpers/ApiError.js";

const TOP_LIMITE = 10;
const SUGERENCIAS_ARTISTAS = 8;
const SUGERENCIAS_GENEROS = 6;
const RECIENTES_LIMITE = 10;
// Last.fm pide no consultarlo de mas: guardamos cada respuesta un minuto.
const CACHE_MS = 60 * 1000;

// De Last.fm solo usamos lo de los ultimos 30 dias: es lo que dice como
// esta hoy cada persona, y pedir un solo periodo hace todo mas rapido.
export const PERIODO_LASTFM = "1month";

const cacheEscuchas = new Map();

async function topArtistasDelMes(usuario, limite) {
  const datos = await lastfmApiRepository.obtenerTopArtistas(usuario, PERIODO_LASTFM, limite);
  return comoLista(datos?.topartists?.artist).map(toArtistaLastfm);
}

function asegurarConfigurado() {
  if (!env.lastfmApiKey) {
    throw new ApiError(503, "Last.fm no está disponible por ahora.");
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

  // Lo que escuchó un usuario (propio o ajeno) en los últimos 30 días.
  async obtenerEscuchas(idUsuario) {
    const cuenta = await lastfmCuentaRepository.obtenerPorUsuario(idUsuario);
    if (!cuenta) return { conectado: false };

    asegurarConfigurado();
    const claveCache = `${idUsuario}|${cuenta.usuario_lastfm}|escuchas`;
    const cacheado = cacheEscuchas.get(claveCache);
    if (cacheado && cacheado.expira > Date.now()) return cacheado.datos;

    const usuario = cuenta.usuario_lastfm;
    const [artistas, canciones, albumes, recientes] = await Promise.all([
      lastfmApiRepository.obtenerTopArtistas(usuario, PERIODO_LASTFM, TOP_LIMITE),
      lastfmApiRepository.obtenerTopCanciones(usuario, PERIODO_LASTFM, TOP_LIMITE),
      lastfmApiRepository.obtenerTopAlbumes(usuario, PERIODO_LASTFM, TOP_LIMITE),
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
      total_reproducciones: Number(recientes?.recenttracks?.["@attr"]?.total) || 0,
      topArtistas,
      topCanciones,
      topAlbumes: comoLista(albumes?.topalbums?.album).map(toAlbumLastfm),
      recientes: await completarImagenes(listaRecientes, "cancion"),
    };

    cacheEscuchas.set(claveCache, { datos, expira: Date.now() + CACHE_MS });
    return datos;
  },

  // Tarjeta corta de arriba del perfil: lo que mas escucho en los ultimos
  // 30 dias, sus generos y el total.
  async obtenerResumen(idUsuario) {
    const cuenta = await lastfmCuentaRepository.obtenerPorUsuario(idUsuario);
    if (!cuenta) return { conectado: false };

    asegurarConfigurado();
    const usuario = cuenta.usuario_lastfm;
    const claveCache = `${idUsuario}|resumen|${usuario}`;
    const cacheado = cacheEscuchas.get(claveCache);
    if (cacheado && cacheado.expira > Date.now()) return cacheado.datos;

    const artistas = await topArtistasDelMes(usuario, TOP_LIMITE);
    const [info, generos, artistaTop] = await Promise.all([
      lastfmApiRepository.obtenerInfoUsuario(usuario).catch(() => null),
      generosPrincipales(artistas.map((a) => a.nombre), 4),
      artistas[0] ? completarImagenes([artistas[0]], "artista").then(([a]) => a) : null,
    ]);

    const datos = {
      conectado: true,
      usuario_lastfm: usuario,
      url_perfil: `https://www.last.fm/user/${encodeURIComponent(usuario)}`,
      total_reproducciones: Number(info?.user?.playcount) || 0,
      artistaTop,
      otrosArtistas: artistas.slice(1, 4).map((a) => a.nombre),
      generos,
    };

    cacheEscuchas.set(claveCache, { datos, expira: Date.now() + CACHE_MS });
    return datos;
  },

  // Al vincular: sus artistas mas escuchados (ya buscados en Spotify, para
  // poder guardarlos como favoritos) y los generos que se deducen de ellos.
  // Saltea lo que ya tiene en el perfil.
  async obtenerSugerencias(idUsuario) {
    const cuenta = await lastfmCuentaRepository.obtenerPorUsuario(idUsuario);
    if (!cuenta || !env.lastfmApiKey) return { artistas: [], generos: [] };

    const [top, favoritos, catalogo, elegidos] = await Promise.all([
      topArtistasDelMes(cuenta.usuario_lastfm, 15),
      artistaFavoritoRepository.listarPorUsuario(idUsuario),
      estiloMusicalRepository.listarCatalogo(),
      estiloMusicalRepository.listarIdsPorUsuario(idUsuario),
    ]);
    const nombres = top.map((a) => a.nombre);

    const nombresFavoritos = new Set(favoritos.map((f) => f.nombre.toLowerCase()));
    const idsFavoritos = new Set(favoritos.map((f) => f.spotify_id));
    const candidatos = nombres
      .filter((nombre) => !nombresFavoritos.has(nombre.toLowerCase()))
      .slice(0, SUGERENCIAS_ARTISTAS);

    const [encontrados, nombresGeneros] = await Promise.all([
      Promise.all(candidatos.map((nombre) => spotifyService.buscarArtistaPorNombre(nombre))),
      generosPrincipales(nombres.slice(0, 10), SUGERENCIAS_GENEROS),
    ]);

    const artistas = [];
    for (const artista of encontrados) {
      if (!artista || idsFavoritos.has(artista.spotify_id)) continue;
      if (artistas.some((a) => a.spotify_id === artista.spotify_id)) continue;
      artistas.push(artista);
    }

    const idsElegidos = new Set(elegidos.map((fila) => String(fila.id_estilo)));
    const generos = nombresGeneros
      .map((nombre) => {
        const existente = catalogo.find((g) => normalizarGenero(g.nombre) === normalizarGenero(nombre));
        return { id: existente?.id ?? null, nombre: existente?.nombre || nombre };
      })
      .filter((genero) => genero.id == null || !idsElegidos.has(String(genero.id)));

    return { artistas, generos };
  },
};
