import { api } from "./api";

// Compatibilidad musical entre fans y recomendaciones de conciertos.
export const matchingService = {
  async compatibilidadCon(idUsuario) {
    return api.get(`/matching/usuarios/${idUsuario}`);
  },

  // { perfilCompleto, fans: [{ id_usuario, nombre, foto_perfil, edad, porcentaje, ... }] }
  async descubrir() {
    return api.get("/matching/me/descubrir");
  },

  async conciertosRecomendados() {
    return api.get("/matching/me/conciertos");
  },
};
