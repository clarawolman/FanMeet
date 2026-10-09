import { api } from "./api";

// Catálogo de Spotify (sin login de usuarios) + artistas favoritos del perfil.
export const spotifyService = {
  async listarFavoritos(idUsuario) {
    return api.get(`/spotify/usuarios/${idUsuario}/favoritos`);
  },

  async agregarFavorito(spotifyId) {
    return api.post("/spotify/me/favoritos", { spotify_id: spotifyId });
  },

  async quitarFavorito(spotifyId) {
    return api.del(`/spotify/me/favoritos/${spotifyId}`);
  },

  // tipo: "artista" | "album" | "cancion"
  // Funciona sin sesión (lo usa el registro).
  async buscar(texto, tipo = "artista") {
    const parametros = new URLSearchParams({ q: texto, tipo });
    return api.get(`/spotify/buscar?${parametros}`, { autenticado: false });
  },
};
