import { api } from "./api";

export const chatsService = {
  async listar() {
    return api.get("/chats");
  },

  async contarNoLeidos() {
    return api.get("/chats/no-leidos");
  },

  async listarMensajes(idUsuario, { antesDe, limite } = {}) {
    const params = new URLSearchParams();
    if (antesDe) params.set("antes_de", antesDe);
    if (limite) params.set("limite", limite);
    const query = params.toString();

    return api.get(`/chats/${idUsuario}/mensajes${query ? `?${query}` : ""}`);
  },

  // Con foto va como multipart (campo "imagen"), igual que usuariosService.subirFoto.
  async enviar(idUsuario, contenido, imagen) {
    if (imagen) {
      const formData = new FormData();
      formData.append("imagen", imagen);
      if (contenido) formData.append("contenido", contenido);
      return api.postForm(`/chats/${idUsuario}/mensajes`, formData);
    }
    return api.post(`/chats/${idUsuario}/mensajes`, { contenido });
  },

  async marcarGrupoLeido(idGrupo) {
    return api.patch(`/chats/grupos/${idGrupo}/leidos`);
  },

  async marcarLeidos(idUsuario) {
    return api.patch(`/chats/${idUsuario}/leidos`);
  },
};
