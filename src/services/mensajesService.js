import { api } from "./api";

export const mensajesService = {
  async listar(idGrupo, { antesDe, limite } = {}) {
    const params = new URLSearchParams();
    if (antesDe) params.set("antes_de", antesDe);
    if (limite) params.set("limite", limite);
    const query = params.toString();

    return api.get(`/grupos/${idGrupo}/mensajes${query ? `?${query}` : ""}`);
  },

  async enviar(idGrupo, contenido) {
    return api.post(`/grupos/${idGrupo}/mensajes`, { contenido });
  },
};
