import { api } from "./api";

export const notificacionesService = {
  async listar() {
    return api.get("/notificaciones");
  },

  async contarNoLeidas() {
    const { count } = await api.get("/notificaciones/no-leidas/count");
    return count;
  },

  async marcarLeidas(ids) {
    return api.patch("/notificaciones/leidas", { ids });
  },

  async eliminar(idNotificacion) {
    return api.del(`/notificaciones/${idNotificacion}`);
  },
};
