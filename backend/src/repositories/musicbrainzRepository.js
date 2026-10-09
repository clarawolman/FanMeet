import { ApiError } from "../helpers/ApiError.js";

// MusicBrainz: base de datos de musica abierta, sin API key. Tiene la
// lista oficial de generos (~2200), que Spotify ya no expone.
// Pide identificarse con un User-Agent propio.
const API_URL = "https://musicbrainz.org/ws/2";
const USER_AGENT = "FanMeet/0.1 (https://github.com/clarawolman/FanMeet)";

export const musicbrainzRepository = {
  // Todos los generos de una sola vez, uno por linea.
  async listarGeneros() {
    let respuesta;
    try {
      respuesta = await fetch(`${API_URL}/genre/all?fmt=txt`, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/plain" },
      });
    } catch (error) {
      throw ApiError.internal(`No se pudo conectar con MusicBrainz: ${error.message}`);
    }

    if (!respuesta.ok) {
      throw new ApiError(503, "La búsqueda de géneros no responde, probá en un rato.");
    }

    const texto = await respuesta.text();
    return texto
      .split("\n")
      .map((linea) => linea.trim())
      .filter(Boolean);
  },
};
