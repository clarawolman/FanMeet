import { api } from "./api";

export const usuariosService = {
  async obtenerPerfil(idUsuario) {
    return api.get(`/usuarios/${idUsuario}`);
  },

  async obtenerEstadisticas(idUsuario) {
    return api.get(`/usuarios/${idUsuario}/estadisticas`);
  },

  async listarHighlights(idUsuario) {
    return api.get(`/usuarios/${idUsuario}/highlights`);
  },

  async actualizarVibra(estiloAsistencia) {
    return api.patch("/usuarios/me/vibra", { estilo_asistencia: estiloAsistencia });
  },

  async subirFoto(archivo) {
    const formData = new FormData();
    formData.append("foto", archivo);
    return api.postForm("/usuarios/me/foto", formData);
  },

  async subirHighlight(archivo) {
    const formData = new FormData();
    formData.append("highlight", archivo);
    return api.postForm("/usuarios/me/highlights", formData);
  },

  async obtenerCatalogoGeneros() {
    return api.get("/usuarios/generos/catalogo", { autenticado: false });
  },

  // Busca en todos los géneros que existen (MusicBrainz + Last.fm), no solo
  // en los que ya eligió alguien. Funciona sin sesión (lo usa el registro).
  async buscarGeneros(texto) {
    const parametros = new URLSearchParams({ q: texto });
    return api.get(`/usuarios/generos/buscar?${parametros}`, { autenticado: false });
  },

  // Devuelve el género del catálogo con su id, creándolo si hacía falta.
  async agregarGeneroAlCatalogo(nombre) {
    return api.post("/usuarios/generos/catalogo", { nombre }, { autenticado: false });
  },

  async obtenerMisGeneros() {
    return api.get("/usuarios/me/generos");
  },

  // Lee los géneros de cualquier perfil (propio o ajeno), a diferencia de
  // obtenerMisGeneros() que solo lee los del usuario autenticado.
  async obtenerGenerosDe(idUsuario) {
    return api.get(`/usuarios/${idUsuario}/generos`);
  },

  async guardarMisGeneros(idsEstilos) {
    return api.put("/usuarios/me/generos", { ids_estilos: idsEstilos });
  },
};
