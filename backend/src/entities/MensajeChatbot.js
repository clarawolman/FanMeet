// Id fijo del "emisor" de las respuestas de la IA, para que el frontend
// pueda pintar estos mensajes con la misma lógica que los privados
// (id_emisor === yo -> burbuja propia).
export const ID_CHATBOT = "fanmeet-bot";

export function toMensajeChatbot(row) {
  if (!row) return null;
  return {
    id_mensaje: row.id_mensaje,
    id_emisor: row.rol === "user" ? row.id_usuario : ID_CHATBOT,
    rol: row.rol,
    contenido: row.contenido,
    created_at: row.created_at,
  };
}
