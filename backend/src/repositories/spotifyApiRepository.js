import { env } from "../config/env.js";
import { ApiError } from "../helpers/ApiError.js";

// Unico punto del backend que habla con la Web API de Spotify. Solo usa el
// token de la app (client credentials): sin login de usuarios, asi no
// aplica el limite de usuarios del "Development mode".
const ACCOUNTS_URL = "https://accounts.spotify.com";
const API_URL = "https://api.spotify.com/v1";

export const spotifyApiRepository = {
  async tokenDeApp() {
    const credenciales = `${env.spotifyClientId}:${env.spotifyClientSecret}`;
    let respuesta;
    try {
      respuesta = await fetch(`${ACCOUNTS_URL}/api/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(credenciales).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ grant_type: "client_credentials" }),
      });
    } catch (error) {
      throw ApiError.internal(`No se pudo conectar con Spotify: ${error.message}`);
    }

    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw ApiError.internal(`Spotify token ${respuesta.status}: ${JSON.stringify(datos)}`);
    }
    return datos;
  },

  async llamar(path, accessToken) {
    let respuesta;
    try {
      respuesta = await fetch(`${API_URL}${path}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (error) {
      throw ApiError.internal(`No se pudo conectar con Spotify: ${error.message}`);
    }

    if (respuesta.status === 404) throw ApiError.notFound("No existe en Spotify");
    if (respuesta.status === 429) {
      throw new ApiError(503, "Spotify está limitando las consultas, probá en un rato.");
    }

    const datos = await respuesta.json().catch(() => null);
    if (!respuesta.ok) {
      throw ApiError.internal(`Spotify API ${respuesta.status} en ${path}: ${JSON.stringify(datos)}`);
    }
    return datos;
  },

  buscar(accessToken, texto, tipo, limite) {
    const parametros = new URLSearchParams({ q: texto, type: tipo, limit: String(limite) });
    return this.llamar(`/search?${parametros}`, accessToken);
  },

  obtenerArtista(accessToken, idArtista) {
    return this.llamar(`/artists/${encodeURIComponent(idArtista)}`, accessToken);
  },
};
