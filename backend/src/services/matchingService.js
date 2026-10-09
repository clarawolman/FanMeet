import { env } from "../config/env.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { artistaFavoritoRepository } from "../repositories/artistaFavoritoRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { lastfmApiRepository, lastfmCuentaRepository } from "../repositories/lastfmRepository.js";
import {
  conciertoRepository,
  usuariosConciertosRepository,
} from "../repositories/conciertoRepository.js";
import { amistadRepository } from "../repositories/amistadRepository.js";
import { comoLista } from "../entities/Lastfm.js";
import { toConciertoResumen } from "../entities/Concierto.js";
import { toUsuarioResumen } from "../entities/Usuario.js";
import { normalizarGenero, familiaDe, esTagGenerico } from "../helpers/generos.js";
import { generoService } from "./generoService.js";
import { ApiError } from "../helpers/ApiError.js";

// Matching de gustos musicales, sin IA: cada usuario se resume en un
// "perfil musical" (artistas y generos con un peso) y dos perfiles se
// comparan con similitud coseno. Las fuentes son:
//   - artistas favoritos del perfil (Spotify)
//   - lo que escucha en Last.fm, si lo vinculo
//   - generos elegidos en el perfil
//   - generos deducidos de sus artistas (tags de Last.fm)
//   - artistas parecidos a los suyos (artist.getSimilar de Last.fm)
//   - conciertos a los que se unio y su vibra de concierto

const TOP_LASTFM = 30;
const ARTISTAS_CON_TAGS = 10;
const ARTISTAS_CON_SIMILARES = 5;
const SIMILARES_POR_ARTISTA = 25;
const TAGS_POR_ARTISTA = 6;
const MIN_PESO_TAG = 20;
// Un artista parecido vale menos que el artista en si.
const PESO_SIMILARES = 0.4;
const PESO_FAMILIA = 0.5;
const MAX_DESCUBRIR = 50;
const MAX_RECOMENDACIONES = 10;

const HORA = 60 * 60 * 1000;
const TTL_TOP_USUARIO = 6 * HORA;
const TTL_ARTISTA = 7 * 24 * HORA;
const LASTFM_EN_PARALELO = 4;

// ── Cache y limite de llamadas a Last.fm ─────────────────────────────────
// Last.fm pide no consultarlo de mas y los tags/similares de un artista casi
// no cambian: se guardan en memoria. Si el server se reinicia se vuelven a
// pedir, sin drama.
const cache = new Map();
let llamadasActivas = 0;
const enEspera = [];

async function conLimite(fn) {
  if (llamadasActivas >= LASTFM_EN_PARALELO) {
    await new Promise((resolve) => enEspera.push(resolve));
  }
  llamadasActivas += 1;
  try {
    return await fn();
  } finally {
    llamadasActivas -= 1;
    enEspera.shift()?.();
  }
}

// Si Last.fm falla devolvemos `vacio`: el matching sigue con lo que haya.
function cacheado(clave, ttl, fn, vacio) {
  const guardado = cache.get(clave);
  if (guardado && guardado.expira > Date.now()) return guardado.promesa;

  const promesa = conLimite(fn).catch((error) => {
    console.error(`Last.fm (${clave}):`, error.message);
    cache.delete(clave);
    return vacio;
  });
  cache.set(clave, { promesa, expira: Date.now() + ttl });
  return promesa;
}

export function limpiarCacheLastfm() {
  cache.clear();
}

function lastfmDisponible() {
  return Boolean(env.lastfmApiKey);
}

export function claveArtista(nombre) {
  return normalizarGenero(nombre);
}

function topArtistasLastfm(usuarioLastfm) {
  return cacheado(
    `top|${usuarioLastfm.toLowerCase()}`,
    TTL_TOP_USUARIO,
    async () => {
      const datos = await lastfmApiRepository.obtenerTopArtistas(usuarioLastfm, "12month", TOP_LASTFM);
      let artistas = comoLista(datos?.topartists?.artist);
      // Si no escucho nada en el ultimo año, usamos lo de siempre.
      if (artistas.length === 0) {
        const historico = await lastfmApiRepository.obtenerTopArtistas(usuarioLastfm, "overall", TOP_LASTFM);
        artistas = comoLista(historico?.topartists?.artist);
      }
      return artistas.map((a) => a.name).filter(Boolean);
    },
    []
  );
}

function tagsDeArtista(nombre) {
  return cacheado(
    `tags|${claveArtista(nombre)}`,
    TTL_ARTISTA,
    async () => {
      const datos = await lastfmApiRepository.obtenerTagsArtista(nombre);
      return comoLista(datos?.toptags?.tag)
        .map((t) => ({ nombre: t.name, peso: Number(t.count) || 0 }))
        .filter((t) => t.peso >= MIN_PESO_TAG && !esTagGenerico(t.nombre))
        .slice(0, TAGS_POR_ARTISTA);
    },
    []
  );
}

function similaresDeArtista(nombre) {
  return cacheado(
    `similares|${claveArtista(nombre)}`,
    TTL_ARTISTA,
    async () => {
      const datos = await lastfmApiRepository.obtenerSimilares(nombre, SIMILARES_POR_ARTISTA);
      return comoLista(datos?.similarartists?.artist).map((a) => ({
        nombre: a.name,
        parecido: Number(a.match) || 0,
      }));
    },
    []
  );
}

// ── Vectores ─────────────────────────────────────────────────────────────
function sumar(mapa, clave, peso) {
  mapa.set(clave, (mapa.get(clave) || 0) + peso);
}

export function coseno(a, b) {
  let producto = 0;
  for (const [clave, peso] of a) {
    const otro = b.get(clave);
    if (otro) producto += peso * otro;
  }
  if (producto === 0) return 0;
  const norma = (m) => Math.sqrt([...m.values()].reduce((total, p) => total + p * p, 0));
  return producto / (norma(a) * norma(b));
}

function sumarGenero(generos, clave, peso, vocabulario) {
  sumar(generos, clave, peso);
  const familia = familiaDe(clave, vocabulario);
  if (familia) sumar(generos, familia, peso * PESO_FAMILIA);
}

// Generos que se deducen de los tags de Last.fm de un artista. Solo cuentan
// los tags que son generos conocidos (MusicBrainz o catalogo).
async function generosDeArtista(nombre, vocabulario) {
  const generos = new Map();
  for (const tag of await tagsDeArtista(nombre)) {
    const clave = normalizarGenero(tag.nombre);
    if (vocabulario.has(clave)) sumarGenero(generos, clave, tag.peso / 100, vocabulario);
  }
  return generos;
}

// Generos principales de una lista de artistas ordenada (el primero pesa
// mas). Devuelve nombres para mostrar. Lo usan el resumen de Last.fm del
// perfil y las sugerencias al vincular.
export async function generosPrincipales(nombresArtistas, cantidad) {
  if (!lastfmDisponible() || nombresArtistas.length === 0) return [];

  const vocabulario = await generoService.vocabulario();
  const total = new Map();
  const porArtista = await Promise.all(
    nombresArtistas.map((nombre) => generosDeArtista(nombre, vocabulario))
  );
  porArtista.forEach((generos, i) => {
    const pesoArtista = 1 - i / (nombresArtistas.length + 5);
    for (const [clave, peso] of generos) sumar(total, clave, peso * pesoArtista);
  });

  return [...total.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, cantidad)
    .map(([clave]) => vocabulario.get(clave) || clave);
}

// ── Datos base (de la base de datos, siempre frescos) ────────────────────
function agruparPor(filas, campo, valor) {
  const mapa = new Map();
  for (const fila of filas) {
    const clave = fila[campo];
    if (!mapa.has(clave)) mapa.set(clave, []);
    mapa.get(clave).push(valor(fila));
  }
  return mapa;
}

async function cargarDatosBase() {
  const [usuarios, catalogo, selecciones, favoritos, cuentasLastfm, asistencias, vocabulario] = await Promise.all([
    usuarioRepository.listarTodos(),
    estiloMusicalRepository.listarCatalogo(),
    estiloMusicalRepository.listarTodasLasSelecciones(),
    artistaFavoritoRepository.listarTodos(),
    lastfmCuentaRepository.listarTodas().catch(() => []),
    usuariosConciertosRepository.listarTodas(),
    generoService.vocabulario(),
  ]);

  const generosPorId = new Map(
    catalogo.map((g) => [String(g.id), { nombre: g.nombre, clave: normalizarGenero(g.nombre) }])
  );

  return {
    usuarios: new Map(usuarios.map((u) => [u.id_usuario, u])),
    generosPorId,
    // clave normalizada -> nombre para mostrar (MusicBrainz + catalogo)
    vocabulario,
    seleccionesPorUsuario: agruparPor(selecciones, "id_usuario", (f) => String(f.id_estilo)),
    favoritosPorUsuario: agruparPor(favoritos, "id_usuario", (f) => f.nombre),
    lastfmPorUsuario: new Map(cuentasLastfm.map((c) => [c.id_usuario, c.usuario_lastfm])),
    conciertosPorUsuario: agruparPor(asistencias, "id_usuario", (f) => String(f.id_concierto)),
    asistentesPorConcierto: agruparPor(asistencias, "id_concierto", (f) => f.id_usuario),
  };
}

// ── Perfil musical de un usuario ─────────────────────────────────────────
export async function construirPerfil(idUsuario, base) {
  // clave -> { nombre, peso, favorito }
  const artistas = new Map();

  function sumarArtista(nombre, peso, favorito) {
    const clave = claveArtista(nombre);
    if (!clave) return;
    const actual = artistas.get(clave);
    artistas.set(clave, {
      nombre: actual?.nombre || nombre,
      peso: Math.min(1, (actual?.peso || 0) + peso),
      favorito: Boolean(actual?.favorito || favorito),
    });
  }

  for (const nombre of base.favoritosPorUsuario.get(idUsuario) || []) {
    sumarArtista(nombre, 1, true);
  }

  const usuarioLastfm = base.lastfmPorUsuario.get(idUsuario);
  if (usuarioLastfm && lastfmDisponible()) {
    const top = await topArtistasLastfm(usuarioLastfm);
    // El nº 1 pesa casi como un favorito; el nº 30, bastante menos.
    top.forEach((nombre, i) => sumarArtista(nombre, 0.9 * (1 - i / (top.length + 10)), false));
  }

  const generos = new Map();
  const generosElegidos = new Set();
  for (const idEstilo of base.seleccionesPorUsuario.get(idUsuario) || []) {
    const genero = base.generosPorId.get(idEstilo);
    if (!genero) continue;
    generosElegidos.add(genero.clave);
    sumarGenero(generos, genero.clave, 1, base.vocabulario);
  }

  const principales = [...artistas.values()].sort((a, b) => b.peso - a.peso);
  // clave -> { nombre, peso, origen } (origen = artista propio que lo trajo)
  const similares = new Map();

  if (lastfmDisponible()) {
    const conTags = principales.slice(0, ARTISTAS_CON_TAGS);
    const generosDeduccion = await Promise.all(
      conTags.map((a) => generosDeArtista(a.nombre, base.vocabulario))
    );
    conTags.forEach((artista, i) => {
      for (const [clave, peso] of generosDeduccion[i]) {
        // Lo deducido pesa menos que lo que la persona eligio a mano.
        sumar(generos, clave, peso * artista.peso * 0.7);
      }
    });

    const conSimilares = principales.slice(0, ARTISTAS_CON_SIMILARES);
    const listas = await Promise.all(conSimilares.map((a) => similaresDeArtista(a.nombre)));
    conSimilares.forEach((artista, i) => {
      for (const similar of listas[i]) {
        const clave = claveArtista(similar.nombre);
        if (artistas.has(clave)) continue;
        const peso = similar.parecido * artista.peso;
        if (peso > (similares.get(clave)?.peso || 0)) {
          similares.set(clave, { nombre: similar.nombre, peso, origen: artista.nombre });
        }
      }
    });
  }

  return {
    idUsuario,
    artistas,
    similares,
    generos,
    generosElegidos,
    conciertos: new Set(base.conciertosPorUsuario.get(idUsuario) || []),
    vibra: base.usuarios.get(idUsuario)?.estilo_asistencia || null,
    usaLastfm: Boolean(usuarioLastfm),
  };
}

function tieneDatos(perfil) {
  return perfil.artistas.size > 0 || perfil.generos.size > 0;
}

// Artistas propios + parecidos (con menos peso): asi dos personas que
// escuchan bandas distintas pero del mismo palo igual dan compatibles.
function vectorArtistas(perfil) {
  const vector = new Map();
  for (const [clave, artista] of perfil.artistas) vector.set(clave, artista.peso);
  for (const [clave, similar] of perfil.similares) {
    sumar(vector, clave, similar.peso * PESO_SIMILARES);
  }
  return vector;
}

function mejores(lista, cantidad) {
  return lista.sort((a, b) => b.orden - a.orden).slice(0, cantidad);
}

// ── Comparacion entre dos perfiles ───────────────────────────────────────
export function compararPerfiles(yo, otro, nombresGeneros = new Map()) {
  if (!tieneDatos(yo) || !tieneDatos(otro)) {
    return { porcentaje: null, artistasEnComun: [], generosEnComun: [], parecidos: [] };
  }

  const hayArtistas = yo.artistas.size > 0 && otro.artistas.size > 0;
  const hayGeneros = yo.generos.size > 0 && otro.generos.size > 0;

  const similitudArtistas = hayArtistas ? coseno(vectorArtistas(yo), vectorArtistas(otro)) : 0;
  const similitudGeneros = hayGeneros ? coseno(yo.generos, otro.generos) : 0;

  let base;
  if (hayArtistas && hayGeneros) base = 0.55 * similitudArtistas + 0.45 * similitudGeneros;
  else if (hayArtistas) base = similitudArtistas;
  // Coincidir solo en 2 o 3 generos amplios (pop, rock) dice poco: sin
  // artistas para comparar, el porcentaje no puede llegar muy alto.
  else base = 0.6 * similitudGeneros;

  const conciertosEnComun = [...yo.conciertos].filter((id) => otro.conciertos.has(id)).length;
  const mismaVibra = Boolean(yo.vibra && yo.vibra === otro.vibra);
  const bonus = Math.min(0.1, 0.05 * conciertosEnComun) + (mismaVibra ? 0.03 : 0);

  // La similitud coseno da numeros bajos aun entre gustos parecidos
  // (0.3 ya es mucho); la curva los lleva a una escala mas intuitiva.
  const crudo = Math.min(1, base + bonus);
  const porcentaje = Math.round(100 * Math.pow(crudo, 0.6));

  const artistasEnComun = mejores(
    [...yo.artistas]
      .filter(([clave]) => otro.artistas.has(clave))
      .map(([clave, a]) => ({ nombre: a.nombre, orden: Math.min(a.peso, otro.artistas.get(clave).peso) })),
    10
  ).map((a) => a.nombre);

  const generosEnComun = mejores(
    [...yo.generos]
      .filter(([clave]) => otro.generos.has(clave) && nombresGeneros.has(clave))
      .map(([clave, peso]) => ({ nombre: nombresGeneros.get(clave), orden: Math.min(peso, otro.generos.get(clave)) })),
    6
  ).map((g) => g.nombre);

  // "A el le gusta X, que se parece a Y que escuchas vos".
  const parecidos = mejores(
    [...otro.artistas]
      .filter(([clave]) => yo.similares.has(clave))
      .map(([clave, a]) => ({
        suyo: a.nombre,
        tuyo: yo.similares.get(clave).origen,
        orden: a.peso * yo.similares.get(clave).peso,
      })),
    3
  ).map(({ suyo, tuyo }) => ({ suyo, tuyo }));

  return {
    porcentaje,
    artistasEnComun,
    generosEnComun,
    parecidos,
    conciertosEnComun,
    mismaVibra,
  };
}

async function construirPerfiles(ids, base) {
  return Promise.all(ids.map((id) => construirPerfil(id, base)));
}

// ── Recomendacion de conciertos ──────────────────────────────────────────
async function puntuarConcierto(concierto, yo, base, amigos) {
  const nombreArtista = concierto.artista?.nombre || "";
  const clave = claveArtista(nombreArtista);
  const motivos = [];
  let puntaje = 0;

  const propio = yo.artistas.get(clave);
  if (propio) {
    puntaje += 1 + propio.peso;
    motivos.push(propio.favorito ? `${nombreArtista} está entre tus favoritos` : `Escuchás a ${nombreArtista}`);
  } else if (nombreArtista && lastfmDisponible()) {
    // Parecido en las dos direcciones: el artista del concierto aparece
    // entre los similares de los tuyos, o uno tuyo entre los suyos.
    const similarMio = yo.similares.get(clave);
    const suyos = await similaresDeArtista(nombreArtista);
    const parecidoAlMio = suyos
      .map((s) => ({ ...s, mio: yo.artistas.get(claveArtista(s.nombre)) }))
      .filter((s) => s.mio)
      .sort((a, b) => b.parecido * b.mio.peso - a.parecido * a.mio.peso)[0];

    const peso = Math.max(similarMio?.peso || 0, parecidoAlMio ? parecidoAlMio.parecido * parecidoAlMio.mio.peso : 0);
    if (peso > 0) {
      puntaje += 0.4 + 0.6 * peso;
      motivos.push(`Si te gusta ${similarMio?.origen || parecidoAlMio.mio.nombre}`);
    }
  }

  const genero = base.generosPorId.get(String(concierto.id_estiloMusical));
  if (genero && yo.generos.has(genero.clave)) {
    puntaje += 0.4 * Math.min(1, yo.generos.get(genero.clave));
    if (yo.generosElegidos.has(genero.clave)) motivos.push(`Te gusta el ${genero.nombre}`);
  }

  if (nombreArtista && lastfmDisponible() && yo.generos.size > 0) {
    const generosArtista = await generosDeArtista(nombreArtista, base.vocabulario);
    puntaje += 0.6 * coseno(generosArtista, yo.generos);
  }

  const amigosQueVan = (base.asistentesPorConcierto.get(concierto.id_concierto) || []).filter((id) =>
    amigos.has(id)
  ).length;
  if (amigosQueVan > 0) {
    puntaje += 0.15 * Math.min(amigosQueVan, 3);
    motivos.push(amigosQueVan === 1 ? "Va 1 amigo tuyo" : `Van ${amigosQueVan} amigos tuyos`);
  }

  return { puntaje, motivo: motivos[0] || "Parecido a lo que escuchás" };
}

// ── API del servicio ─────────────────────────────────────────────────────
export const matchingService = {
  async compatibilidad(idYo, idOtro) {
    if (idYo === idOtro) throw ApiError.badRequest("No podés compararte con vos mismo");

    const base = await cargarDatosBase();
    if (!base.usuarios.has(idOtro)) throw ApiError.notFound("El usuario no existe");

    const [yo, otro] = await construirPerfiles([idYo, idOtro], base);
    return compararPerfiles(yo, otro, base.vocabulario);
  },

  // Fans ordenados por compatibilidad con el usuario autenticado.
  async descubrir(idYo) {
    const base = await cargarDatosBase();
    const ids = [...base.usuarios.keys()].filter((id) => id !== idYo);
    const [yo, ...otros] = await construirPerfiles([idYo, ...ids], base);

    if (!tieneDatos(yo)) return { perfilCompleto: false, fans: [] };

    const fans = otros
      .map((otro) => ({ otro, resultado: compararPerfiles(yo, otro, base.vocabulario) }))
      .filter(({ resultado }) => resultado.porcentaje)
      .sort((a, b) => b.resultado.porcentaje - a.resultado.porcentaje)
      .slice(0, MAX_DESCUBRIR)
      .map(({ otro, resultado }) => ({
        ...toUsuarioResumen(base.usuarios.get(otro.idUsuario)),
        ...resultado,
      }));

    return { perfilCompleto: true, fans };
  },

  // Conciertos a los que todavia no se unio, ordenados por afinidad.
  async recomendarConciertos(idYo) {
    const [base, conciertos, amistades] = await Promise.all([
      cargarDatosBase(),
      conciertoRepository.listarTodos(),
      amistadRepository.listarAceptadasDeUsuario(idYo),
    ]);

    const yo = await construirPerfil(idYo, base);
    if (!tieneDatos(yo)) return [];

    const amigos = new Set(
      amistades.map((a) => (a.id_solicitante === idYo ? a.id_receptor : a.id_solicitante))
    );
    const candidatos = conciertos.filter((c) => !yo.conciertos.has(String(c.id_concierto)));
    const puntajes = await Promise.all(candidatos.map((c) => puntuarConcierto(c, yo, base, amigos)));

    return candidatos
      .map((concierto, i) => ({ concierto, ...puntajes[i] }))
      .filter((r) => r.puntaje > 0.1)
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, MAX_RECOMENDACIONES)
      .map(({ concierto, motivo }) => ({ ...toConciertoResumen(concierto), motivo }));
  },
};
