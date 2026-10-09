import { api } from "./api";

export const lastfmService = {
  // periodo: "semana" | "mes" | "trimestre" | "semestre" | "anio" | "siempre"
  async obtenerEscuchas(idUsuario, periodo = "mes") {
    return api.get(`/lastfm/usuarios/${idUsuario}/escuchas?periodo=${periodo}`);
  },

  // Tarjeta corta de arriba del perfil. { conectado: false } si no vinculó.
  async obtenerResumen(idUsuario) {
    return api.get(`/lastfm/usuarios/${idUsuario}/resumen`);
  },

  // Artistas (con id de Spotify) y géneros para sumar al perfil al vincular.
  async obtenerSugerencias() {
    return api.get("/lastfm/me/sugerencias");
  },

  async vincular(usuarioLastfm) {
    return api.put("/lastfm/me", { usuario_lastfm: usuarioLastfm });
  },

  async desvincular() {
    return api.del("/lastfm/me");
  },
};
