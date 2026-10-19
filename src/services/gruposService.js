import { api } from "./api";

export const gruposService = {
  async crear(datosGrupo) {
    return api.post("/grupos", datosGrupo);
  },

  async obtenerDetalle(idGrupo) {
    return api.get(`/grupos/${idGrupo}`);
  },

  async listarMisGrupos() {
    return api.get("/grupos/mios");
  },

  async unirse(idGrupo) {
    return api.post(`/grupos/${idGrupo}/unirse`);
  },

  async salir(idGrupo) {
    return api.del(`/grupos/${idGrupo}/salir`);
  },

  async eliminar(idGrupo) {
    return api.del(`/grupos/${idGrupo}`);
  },

  // Solo el creador. Devuelve el grupo actualizado (con sus usuarios).
  actualizar(idGrupo, cambios) {
    return api.patch(`/grupos/${idGrupo}`, cambios);
  },
};
