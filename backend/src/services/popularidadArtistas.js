import { env } from "../config/env.js";
import { lastfmApiRepository } from "../repositories/lastfmRepository.js";
import { spotifyService } from "./spotifyService.js";
import { normalizarGenero } from "../helpers/generos.js";

// Qué tan escuchado es cada artista, de 0 a 1. Lo usan los "Destacados" de
// la home: un recital de un artista enorme (Bad Bunny) tiene que aparecer
// arriba aunque todavía se haya unido poca gente en FanMeet.
// Fuentes: la popularidad de Spotify (0-100, sale de las reproducciones
// recientes) y los oyentes de Last.fm. Si hay las dos, se promedian.
// Cambia poco: se guarda en memoria un día.

const TTL_MS = 24 * 60 * 60 * 1000;
// La home no espera más que esto: lo que no llegó se sigue pidiendo de
// fondo y queda en el cache para la próxima.
const ESPERA_MAXIMA_MS = 2500;

const cache = new Map();

function clave(nombre) {
  return normalizarGenero(nombre);
}

// popularity de Spotify: un artista chico anda por 20-30, uno enorme por 90+.
function escalaSpotify(popularidad) {
  return Math.max(0, Math.min(1, (popularidad - 15) / 80));
}

// Oyentes de Last.fm, en escala logarítmica: 1.000 -> 0, 10.000.000 -> 1.
function escalaOyentes(oyentes) {
  if (!oyentes || oyentes <= 0) return 0;
  return Math.max(0, Math.min(1, (Math.log10(oyentes) - 3) / 4));
}

// Seguidores de Spotify, por si no viene popularity: 1.000 -> 0, 50M -> 1.
function escalaSeguidores(seguidores) {
  if (!seguidores || seguidores <= 0) return 0;
  return Math.max(0, Math.min(1, (Math.log10(seguidores) - 3) / 4.7));
}

async function oyentesLastfm(nombre) {
  if (!env.lastfmApiKey) return null;
  try {
    const datos = await lastfmApiRepository.obtenerInfoArtista(nombre);
    const oyentes = Number(datos?.artist?.stats?.listeners);
    return Number.isFinite(oyentes) && oyentes > 0 ? oyentes : null;
  } catch (error) {
    console.error(`Last.fm (oyentes de ${nombre}):`, error.message);
    return null;
  }
}

async function calcular(nombre) {
  const [spotify, oyentes] = await Promise.all([
    spotifyService.popularidadArtista(nombre),
    oyentesLastfm(nombre),
  ]);

  const valores = [];
  if (spotify?.popularidad != null) valores.push(escalaSpotify(spotify.popularidad));
  else if (spotify?.seguidores != null) valores.push(escalaSeguidores(spotify.seguidores));
  if (oyentes != null) valores.push(escalaOyentes(oyentes));

  if (valores.length === 0) return null;
  return valores.reduce((total, v) => total + v, 0) / valores.length;
}

function pedir(nombre) {
  const k = clave(nombre);
  const guardado = cache.get(k);
  if (guardado && guardado.expira > Date.now()) return guardado.promesa;

  const promesa = calcular(nombre).then((valor) => {
    // Si no se pudo (sin claves, Spotify caído) se reintenta en una hora.
    if (valor == null) cache.set(k, { promesa, expira: Date.now() + TTL_MS / 24 });
    return valor;
  });
  cache.set(k, { promesa, expira: Date.now() + TTL_MS });
  return promesa;
}

export function limpiarCachePopularidad() {
  cache.clear();
}

// nombre de artista -> popularidad (0 a 1, o null si no se sabe todavía).
export async function popularidadDeArtistas(nombres, { esperaMaximaMs = ESPERA_MAXIMA_MS } = {}) {
  const unicos = [...new Set(nombres.filter(Boolean))];
  const resultado = new Map();
  const hasta = Date.now() + esperaMaximaMs;

  await Promise.all(
    unicos.map(async (nombre) => {
      const restante = hasta - Date.now();
      let temporizador;
      const tarde = new Promise((resolve) => {
        temporizador = setTimeout(() => resolve(null), Math.max(0, restante));
      });
      const valor = await Promise.race([pedir(nombre), tarde]);
      clearTimeout(temporizador);
      resultado.set(nombre, valor);
    })
  );

  return resultado;
}

// Puntaje para ordenar los "Destacados": pesa mucho lo escuchado que es el
// artista y también cuánta gente ya se unió en FanMeet (en escala
// logarítmica respecto del concierto con más unidos).
export const PESO_POPULARIDAD = 0.6;
export const PESO_UNIDOS = 0.4;

export function puntajeDestacado({ popularidad, unidos, maxUnidos }) {
  const unidosNorm = maxUnidos > 0 ? Math.log1p(unidos || 0) / Math.log1p(maxUnidos) : 0;
  return PESO_POPULARIDAD * (popularidad ?? 0) + PESO_UNIDOS * unidosNorm;
}
