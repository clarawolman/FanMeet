import { api } from "./api";

export const conciertosService = {
  async listar() {
    return api.get("/conciertos");
  },

  async obtenerDetalle(idConcierto) {
    return api.get(`/conciertos/${idConcierto}`);
  },

  async listarMisEventos() {
    return api.get("/conciertos/mis-eventos");
  },

  async unirsePorCodigo(idConcierto, codigo) {
    return api.post(`/conciertos/${idConcierto}/unirse`, { codigo });
  },

  async salir(idConcierto) {
    return api.del(`/conciertos/${idConcierto}/salir`);
  },
};
