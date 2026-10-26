import { api } from "./api";

export const usuariosService = {
  async obtenerMiPerfil() {
    return api.get("/usuarios/me");
  },

  // [{ id_usuario, nombre, apodo, foto_perfil, edad }]
  async buscar(texto) {
    return api.get(`/usuarios/buscar?q=${encodeURIComponent(texto)}`);
  },

  async obtenerPerfil(idUsuario) {
    return api.get(`/usuarios/${idUsuario}`);
  },

  async obtenerEstadisticas(idUsuario) {
    return api.get(`/usuarios/${idUsuario}/estadisticas`);
  },

  async actualizarVibra(estiloAsistencia) {
    return api.patch("/usuarios/me/vibra", { estilo_asistencia: estiloAsistencia });
  },

  // "" borra el apodo.
  async actualizarApodo(apodo) {
    return api.patch("/usuarios/me/apodo", { apodo });
  },

  async subirFoto(archivo) {
    const formData = new FormData();
    formData.append("foto", archivo);
    return api.postForm("/usuarios/me/foto", formData);
  },

  // Vuelve a la foto por defecto
  async eliminarFoto() {
    return api.del("/usuarios/me/foto");
  },

  // ── Configuración
  // Solo lo que cambió, ej. { perfil_privado: true } o { notificaciones: { momentos: false } }.
  // Devuelve el usuario con las preferencias completas.
  async actualizarPreferencias(cambios) {
    return api.patch("/usuarios/me/preferencias", cambios);
  },

  // "" borra la ciudad
  async actualizarCiudad(ciudad) {
    return api.patch("/usuarios/me/ciudad", { ciudad });
  },

  async cambiarContrasena(actual, nueva) {
    return api.post("/usuarios/me/contrasena", { actual, nueva });
  },

  async cambiarMail(mail, contrasena) {
    return api.post("/usuarios/me/mail", { mail, contrasena });
  },

  async eliminarCuenta(contrasena) {
    return api.post("/usuarios/me/eliminar", { contrasena });
  },

  // tipo: "problema" | "sugerencia"
  async enviarSugerencia(tipo, texto) {
    return api.post("/usuarios/me/sugerencias", { tipo, texto });
  },

  // "Editar perfil": { apodo, descripcion, nombre }, solo lo que cambió.
  // El @nombre se puede cambiar una vez cada 15 días.
  async actualizarPerfil(cambios) {
    return api.patch("/usuarios/me/perfil", cambios);
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
