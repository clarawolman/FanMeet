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
  async enviar(contenido) {
    return api.post("/chatbot/mensajes", { contenido });
  },
};
