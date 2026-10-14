import { api, API_URL } from "./api";

// Mensaje que manda public/lastfm-callback.html a esta ventana.
export const MENSAJE_LASTFM = "fanmeet-lastfm";

export const lastfmService = {
  // Lo que escuchó en los últimos 30 días.
  async obtenerEscuchas(idUsuario) {
    return api.get(`/lastfm/usuarios/${idUsuario}/escuchas`);
  },

  // Tarjeta corta de arriba del perfil. { conectado: false } si no vinculó.
  async obtenerResumen(idUsuario) {
    return api.get(`/lastfm/usuarios/${idUsuario}/resumen`);
  },

  // Artistas (con id de Spotify) y géneros para sumar al perfil al vincular.
  async obtenerSugerencias() {
    return api.get("/lastfm/me/sugerencias");
  },

  // Página que se abre en el popup: redirige a Last.fm para iniciar sesión
  // y aprobar FanMeet, y vuelve a /lastfm-callback.html con el token.
  urlAutorizacion() {
    return `${API_URL}/lastfm/autorizar?origen=${encodeURIComponent(window.location.origin)}`;
  },

  // El backend le pregunta a Last.fm de quién es la cuenta que aprobó ese
  // token y vincula esa (no se escribe el usuario a mano).
  async vincular(token) {
    return api.put("/lastfm/me", { token });
  },

  async desvincular() {
    return api.del("/lastfm/me");
  },
};
