import { api } from "./api";

export const lastfmService = {
  // periodo: "semana" | "mes" | "trimestre" | "semestre" | "anio" | "siempre"
  async obtenerEscuchas(idUsuario, periodo = "mes") {
    return api.get(`/lastfm/usuarios/${idUsuario}/escuchas?periodo=${periodo}`);
  },

  async vincular(usuarioLastfm) {
    return api.put("/lastfm/me", { usuario_lastfm: usuarioLastfm });
  },

  async desvincular() {
    return api.del("/lastfm/me");
  },
};
