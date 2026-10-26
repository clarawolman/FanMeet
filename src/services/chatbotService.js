import { api } from "./api";

// Mismo id que backend/src/entities/MensajeChatbot.js: las respuestas de la
// IA llegan con id_emisor = ID_CHATBOT.
export const ID_CHATBOT = "fanmeet-bot";

export const chatbotService = {
  async listarMensajes({ antesDe, limite } = {}) {
    const params = new URLSearchParams();
    if (antesDe) params.set("antes_de", antesDe);
    if (limite) params.set("limite", limite);
    const query = params.toString();

    return api.get(`/chatbot/mensajes${query ? `?${query}` : ""}`);
  },

  // Devuelve { mensajeUsuario, respuesta }
  // Borra toda la conversación con Fani
  async borrarHistorial() {
    return api.del("/chatbot/mensajes");
  },

  async enviar(contenido) {
    return api.post("/chatbot/mensajes", { contenido });
  },

  // Unirme en una tarjeta de Fani (objetivo: { idGrupo } o { idConcierto,
  // codigo }) o Confirmar / Cancelar una propuesta vieja. Devuelve
  // { mensaje, respuesta }: el mensaje actualizado y, si se unió, la
  // respuesta nueva de Fani (si no, null).
  async resolverAccion(idMensaje, decision, objetivo = {}) {
    const { idGrupo, idConcierto, codigo } = objetivo;
    return api.post(`/chatbot/mensajes/${idMensaje}/accion`, {
      decision,
      ...(idGrupo ? { id_grupo: idGrupo } : {}),
      ...(idConcierto ? { id_concierto: idConcierto, codigo } : {}),
    });
  },
};
