import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

const TABLA = "mensaje_chatbot";

export const mensajeChatbotRepository = {
  // `accion` solo se manda si hay una: así el chat sigue andando aunque
  // todavía no se haya corrido supabase/fani_acciones.sql.
  async crear({ idUsuario, rol, contenido, accion }) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .insert([{ id_usuario: idUsuario, rol, contenido, ...(accion ? { accion } : {}) }])
      .select()
      .single();
    return unwrap(resultado, "Error guardando el mensaje del chatbot");
  },

  // Solo un mensaje del propio usuario: el id de otro no encuentra nada.
  async obtenerDeUsuario(idUsuario, idMensaje) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("id_mensaje", idMensaje)
      .eq("id_usuario", idUsuario)
      .maybeSingle();
    return unwrap(resultado, "Error cargando el mensaje de Fani");
  },

  // Cambia la acción solo si sigue en `estadoEsperado`: si se toca Confirmar
  // dos veces a la vez, la segunda no encuentra la fila (devuelve null).
  async cambiarAccion(idMensaje, estadoEsperado, accionNueva) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .update({ accion: accionNueva })
      .eq("id_mensaje", idMensaje)
      .eq("accion->>estado", estadoEsperado)
      .select()
      .maybeSingle();
    return unwrap(resultado, "Error actualizando la acción de Fani");
  },

  // Igual que mensajePrivadoRepository.listarConversacion: los ultimos
  // `limite` mensajes en orden cronologico; con `antesDeId` pagina hacia atras.
  // "Borrar la conversación con Fani" desde Configuración
  async eliminarDeUsuario(idUsuario) {
    const resultado = await supabaseAdmin.from(TABLA).delete().eq("id_usuario", idUsuario);
    unwrap(resultado, "Error borrando la conversación");
  },

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
