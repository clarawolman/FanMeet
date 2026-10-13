import { env } from "../config/env.js";
import { musicbrainzRepository } from "../repositories/musicbrainzRepository.js";
import { lastfmApiRepository } from "../repositories/lastfmRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { normalizarGenero, esTagGenerico } from "../helpers/generos.js";
import { ApiError } from "../helpers/ApiError.js";

const RESULTADOS = 20;
// Cuanta gente tiene que usar un tag de Last.fm para tomarlo como genero
// ("rkt" tiene ~30, uno inventado tiene 0).
const MIN_REACH_LASTFM = 20;
const DIA = 24 * 60 * 60 * 1000;

// La lista de MusicBrainz casi no cambia: se pide una vez por dia.
let generosMusicbrainz = null;
const cacheTags = new Map();

async function listaMusicbrainz() {
  if (generosMusicbrainz && generosMusicbrainz.expira > Date.now()) {
    return generosMusicbrainz.promesa;
  }
  const promesa = musicbrainzRepository.listarGeneros().catch((error) => {
    console.error("No se pudo cargar la lista de MusicBrainz:", error.message);
    generosMusicbrainz = null;
    return [];
  });
  generosMusicbrainz = { promesa, expira: Date.now() + DIA };
  return promesa;
}

// true si mucha gente usa ese tag en Last.fm. Nunca falla.
async function existeEnLastfm(nombre) {
  if (!env.lastfmApiKey || esTagGenerico(nombre)) return false;
  const clave = normalizarGenero(nombre);
  if (cacheTags.has(clave)) return cacheTags.get(clave);

  try {
    const info = await lastfmApiRepository.obtenerInfoTag(nombre);
    const existe = (Number(info?.tag?.reach) || 0) >= MIN_REACH_LASTFM;
    cacheTags.set(clave, existe);
    return existe;
  } catch (error) {
    console.error("No se pudo consultar el tag en Last.fm:", error.message);
    return false;
  }
}

// Exacto primero, despues los que empiezan igual, despues los que lo
// contienen en otra palabra ("trap" -> "trap", "trap metal", "latin trap").
function relevancia(clave, consulta) {
  if (clave === consulta) return 0;
  if (clave.startsWith(consulta)) return 1;
  if (clave.includes(` ${consulta}`)) return 2;
  return 3;
}

export const generoService = {
  // Claves normalizadas de todos los generos conocidos: MusicBrainz + los
  // que ya estan en el catalogo. El matching lo usa para saber que tags de
  // Last.fm son generos de verdad. clave -> nombre para mostrar.
  async vocabulario() {
    const [musicbrainz, catalogo] = await Promise.all([
      listaMusicbrainz(),
      estiloMusicalRepository.listarCatalogo(),
    ]);
    const mapa = new Map(musicbrainz.map((nombre) => [normalizarGenero(nombre), nombre]));
    for (const genero of catalogo) mapa.set(normalizarGenero(genero.nombre), genero.nombre);
    return mapa;
  },

  // Busca en todo MusicBrainz (como el buscador de artistas de Spotify) y,
  // si lo escrito no esta ahi, en Last.fm. Los que ya estan en el catalogo
  // vienen con su id.
  async buscar(texto) {
    const consulta = normalizarGenero(texto);
    if (!consulta) return [];

    const [musicbrainz, catalogo] = await Promise.all([
      listaMusicbrainz(),
      estiloMusicalRepository.listarCatalogo(),
    ]);

    const encontrados = new Map();
    for (const genero of catalogo) {
      const clave = normalizarGenero(genero.nombre);
      if (clave.includes(consulta)) encontrados.set(clave, { id: genero.id, nombre: genero.nombre });
    }
    for (const nombre of musicbrainz) {
      const clave = normalizarGenero(nombre);
      if (clave.includes(consulta) && !encontrados.has(clave)) {
        encontrados.set(clave, { id: null, nombre });
      }
    }

    if (!encontrados.has(consulta) && (await existeEnLastfm(consulta))) {
      encontrados.set(consulta, { id: null, nombre: consulta });
    }

    return [...encontrados.entries()]
      .sort(
        ([a], [b]) => relevancia(a, consulta) - relevancia(b, consulta) || a.length - b.length
      )
      .slice(0, RESULTADOS)
      .map(([, genero]) => genero);
  },

  // Devuelve el genero del catalogo, creandolo si hace falta. Solo se crean
  // generos que existen afuera, asi nadie guarda cualquier texto.
  async obtenerOCrear(nombre) {
    const clave = normalizarGenero(nombre);
    if (!clave) throw ApiError.badRequest("Escribí un género");

    const catalogo = await estiloMusicalRepository.listarCatalogo();
    const existente = catalogo.find((g) => normalizarGenero(g.nombre) === clave);
    if (existente) return existente;

    const musicbrainz = await listaMusicbrainz();
    const deMusicbrainz = musicbrainz.find((g) => normalizarGenero(g) === clave);
    if (deMusicbrainz) return estiloMusicalRepository.crear(deMusicbrainz);

    if (await existeEnLastfm(clave)) {
      return estiloMusicalRepository.crear(String(nombre).trim().replace(/\s+/g, " ").toLowerCase());
    }

    throw ApiError.notFound(`No encontramos el género "${String(nombre).trim()}"`);
  },
};
