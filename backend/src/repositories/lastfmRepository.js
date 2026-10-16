import { createHash } from "node:crypto";
import { supabaseAdmin } from "../config/supabaseClient.js";
import { env } from "../config/env.js";
import { unwrap } from "../helpers/supabaseResult.js";
import { ApiError } from "../helpers/ApiError.js";

const API_URL = "https://ws.audioscrobbler.com/2.0/";
// Pantalla de Last.fm donde la persona inicia sesion y aprueba FanMeet.
const AUTH_URL = "https://www.last.fm/api/auth/";

// Codigos de error de la API de Last.fm que nos interesan.
const ERROR_USUARIO_INEXISTENTE = 6;
const ERROR_LIMITE = 29;
// Token invalido, no autorizado todavia o vencido (dura 60 minutos).
const ERRORES_TOKEN = [4, 14, 15];

// Tabla creada por supabase/lastfm.sql.
export const lastfmCuentaRepository = {
  async obtenerPorUsuario(idUsuario) {
    const resultado = await supabaseAdmin
      .from("lastfm_cuenta")
      .select("*")
      .eq("id_usuario", idUsuario)
      .maybeSingle();
    return unwrap(resultado, "Error cargando cuenta de Last.fm");
  },

  async listarTodas() {
    const resultado = await supabaseAdmin.from("lastfm_cuenta").select("id_usuario, usuario_lastfm");
    return unwrap(resultado, "Error cargando cuentas de Last.fm");
  },

  async guardar(idUsuario, usuarioLastfm) {
    const resultado = await supabaseAdmin
      .from("lastfm_cuenta")
      .upsert([{ id_usuario: idUsuario, usuario_lastfm: usuarioLastfm }], {
        onConflict: "id_usuario",
      })
      .select()
      .single();
    return unwrap(resultado, "Error guardando cuenta de Last.fm");
  },

  async eliminar(idUsuario) {
    const resultado = await supabaseAdmin
      .from("lastfm_cuenta")
      .delete()
      .eq("id_usuario", idUsuario);
    return unwrap(resultado, "Error desvinculando Last.fm");
  },
};

// Firma de Last.fm: md5 de todos los parametros (menos format) ordenados
// por nombre y pegados como "clavevalor", seguido del shared secret.
function firmar(parametros) {
  const base = Object.keys(parametros)
    .sort()
    .map((clave) => `${clave}${parametros[clave]}`)
    .join("");
  return createHash("md5").update(base + env.lastfmSharedSecret, "utf8").digest("hex");
}

async function llamar(metodo, parametros, { firmado = false } = {}) {
  const base = { method: metodo, api_key: env.lastfmApiKey, ...parametros };
  const query = new URLSearchParams({
    ...base,
    ...(firmado ? { api_sig: firmar(base) } : {}),
    format: "json",
  });

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}?${query}`);
  } catch (error) {
    throw ApiError.internal(`No se pudo conectar con Last.fm: ${error.message}`);
  }

  const datos = await respuesta.json().catch(() => null);

  if (datos?.error === ERROR_USUARIO_INEXISTENTE) {
    throw ApiError.notFound("No existe ese usuario en Last.fm");
  }
  if (ERRORES_TOKEN.includes(datos?.error)) {
    throw ApiError.badRequest(
      "No pudimos confirmar tu cuenta de Last.fm. Volvé a intentarlo y aprobá el acceso."
    );
  }
  if (datos?.error === ERROR_LIMITE) {
    throw new ApiError(503, "Last.fm está limitando las consultas, probá en un rato.");
  }
  if (!respuesta.ok || datos?.error) {
    throw ApiError.internal(`Last.fm ${metodo} ${respuesta.status}: ${JSON.stringify(datos)}`);
  }

  return datos;
}

// Lectura de datos publicos de Last.fm: alcanza con el nombre de usuario,
// no hace falta que la persona inicie sesion. La unica excepcion es la
// vinculacion (urlAutorizacion + obtenerSesion), que prueba que la cuenta
// es de quien la vincula.
export const lastfmApiRepository = {
  // Last.fm vuelve a `callback` con "?token=..." cuando la persona aprueba.
  urlAutorizacion(callback) {
    const query = new URLSearchParams({ api_key: env.lastfmApiKey, cb: callback });
    return `${AUTH_URL}?${query}`;
  },

  // Canjea el token aprobado: Last.fm responde con el usuario que lo aprobo
  // ({ session: { name, key } }). Cada token sirve una sola vez.
  obtenerSesion(token) {
    return llamar("auth.getSession", { token }, { firmado: true });
  },

  obtenerInfoUsuario(usuario) {
    return llamar("user.getInfo", { user: usuario });
  },

  obtenerTopArtistas(usuario, periodo, limite) {
    return llamar("user.getTopArtists", { user: usuario, period: periodo, limit: limite });
  },

  obtenerTopCanciones(usuario, periodo, limite) {
    return llamar("user.getTopTracks", { user: usuario, period: periodo, limit: limite });
  },

  obtenerTopAlbumes(usuario, periodo, limite) {
    return llamar("user.getTopAlbums", { user: usuario, period: periodo, limit: limite });
  },

  obtenerRecientes(usuario, limite) {
    return llamar("user.getRecentTracks", { user: usuario, limit: limite });
  },

  // Generos (tags) de un artista, con un peso de 0 a 100 cada uno.
  obtenerTagsArtista(artista) {
    return llamar("artist.getTopTags", { artist: artista, autocorrect: 1 });
  },

  obtenerSimilares(artista, limite) {
    return llamar("artist.getSimilar", { artist: artista, limit: limite, autocorrect: 1 });
  },

  // reach = cuanta gente usa ese tag. Un tag inventado da reach 0.
  obtenerInfoTag(tag) {
    return llamar("tag.getInfo", { tag });
  },
};
