import { api } from "./api";

export const mensajesService = {
  async listar(idGrupo, { antesDe, limite } = {}) {
    const params = new URLSearchParams();
    if (antesDe) params.set("antes_de", antesDe);
    if (limite) params.set("limite", limite);
    const query = params.toString();

    return api.get(`/grupos/${idGrupo}/mensajes${query ? `?${query}` : ""}`);
  },

  // Igual que chatsService.enviar: con foto va como multipart.
  async enviar(idGrupo, contenido, imagen) {
    if (imagen) {
      const formData = new FormData();
      formData.append("imagen", imagen);
      if (contenido) formData.append("contenido", contenido);
      return api.postForm(`/grupos/${idGrupo}/mensajes`, formData);
    }
    return api.post(`/grupos/${idGrupo}/mensajes`, { contenido });
  },
};
