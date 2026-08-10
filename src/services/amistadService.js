import { api } from "./api";

export const amistadService = {
  async obtenerEstado(idUsuario) {
    return api.get(`/amistades/estado/${idUsuario}`);
  },

  async crearSolicitud(idReceptor) {
    return api.post("/amistades", { id_receptor: idReceptor });
  },

  async aceptar(idAmistad) {
    return api.patch(`/amistades/${idAmistad}/aceptar`);
  },

  async listarAmigos(idUsuario) {
    return api.get(`/amistades/amigos/${idUsuario}`);
  },
};
