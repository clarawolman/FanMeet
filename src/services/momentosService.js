import { api } from "./api";

// Momentos: publicaciones como las de Instagram (fotos, pie, concierto,
// me gusta, comentarios, guardados, fijados).
export const momentosService = {
  async listarDeUsuario(idUsuario) {
    return api.get(`/usuarios/${idUsuario}/highlights`);
  },

  async listarGuardados() {
    return api.get("/momentos/guardados");
  },

  async obtener(idMomento) {
    return api.get(`/momentos/${idMomento}`);
  },

  // { fotos: File[], descripcion, idConcierto, etiquetados, comentariosActivados, ocultarLikes }
  async publicar({ fotos, descripcion, idConcierto, etiquetados, comentariosActivados, ocultarLikes }) {
    const formData = new FormData();
    fotos.forEach((foto) => formData.append("fotos", foto));
    if (descripcion) formData.append("descripcion", descripcion);
    if (idConcierto) formData.append("id_concierto", String(idConcierto));
    if (etiquetados?.length) formData.append("etiquetados", JSON.stringify(etiquetados));
    formData.append("comentarios_activados", JSON.stringify(comentariosActivados));
    formData.append("ocultar_likes", JSON.stringify(ocultarLikes));
    return api.postForm("/usuarios/me/highlights", formData);
  },

  // { descripcion, id_concierto, comentarios_activados, ocultar_likes }
  async editar(idMomento, cambios) {
    return api.patch(`/momentos/${idMomento}`, cambios);
  },

  async aceptarInvitacion(idMomento) {
    return api.post(`/usuarios/me/highlights/${idMomento}/aceptar`);
  },

  // Rechazar la invitación o sacarlo de mis momentos (a los demás les queda)
  async quitarDeMiPerfil(idMomento) {
    return api.del(`/usuarios/me/highlights/${idMomento}`);
  },

  async darLike(idMomento) {
    return api.post(`/momentos/${idMomento}/like`);
  },

  async quitarLike(idMomento) {
    return api.del(`/momentos/${idMomento}/like`);
  },

  async listarLikes(idMomento) {
    return api.get(`/momentos/${idMomento}/likes`);
  },

  async comentar(idMomento, texto, idRespuestaA = null) {
    return api.post(`/momentos/${idMomento}/comentarios`, { texto, id_respuesta_a: idRespuestaA });
  },

  async eliminarComentario(idMomento, idComentario) {
    return api.del(`/momentos/${idMomento}/comentarios/${idComentario}`);
  },

  async darLikeComentario(idMomento, idComentario) {
    return api.post(`/momentos/${idMomento}/comentarios/${idComentario}/like`);
  },

  async quitarLikeComentario(idMomento, idComentario) {
    return api.del(`/momentos/${idMomento}/comentarios/${idComentario}/like`);
  },

  async guardar(idMomento) {
    return api.post(`/momentos/${idMomento}/guardado`);
  },

  async quitarGuardado(idMomento) {
    return api.del(`/momentos/${idMomento}/guardado`);
  },

  async fijar(idMomento) {
    return api.post(`/momentos/${idMomento}/fijado`);
  },

  async desfijar(idMomento) {
    return api.del(`/momentos/${idMomento}/fijado`);
  },
};

// Link para compartir (se abre la pantalla del momento, ver utils/rutas.js)
export function linkDeMomento(idMomento) {
  return `${window.location.origin}/momento/${idMomento}`;
}

// Si un mensaje de chat es un momento compartido, su id
export function idMomentoEnTexto(texto) {
  const coincidencia = String(texto || "").match(/\/momento\/(\d+|[0-9a-fA-F-]{36})\b/);
  return coincidencia ? coincidencia[1] : null;
}
