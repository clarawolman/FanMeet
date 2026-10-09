import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

const TABLA = "mensaje_chatbot";

export const mensajeChatbotRepository = {
  async crear({ idUsuario, rol, contenido }) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .insert([{ id_usuario: idUsuario, rol, contenido }])
      .select()
      .single();
    return unwrap(resultado, "Error guardando el mensaje del chatbot");
  },

  // Igual que mensajePrivadoRepository.listarConversacion: los ultimos
  // `limite` mensajes en orden cronologico; con `antesDeId` pagina hacia atras.
  async listarDeUsuario(idUsuario, { limite = 50, antesDeId } = {}) {
    let query = supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("id_usuario", idUsuario)
      .order("id_mensaje", { ascending: false })
      .limit(limite);

    if (antesDeId) {
      query = query.lt("id_mensaje", antesDeId);
    }

    const resultado = await query;
    const filas = unwrap(resultado, "Error cargando el chat con Fani");
    return filas.reverse();
  },
};
