import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

const TABLA = "mensaje_privado";

function filtroConversacion(idUsuarioA, idUsuarioB) {
  return `and(id_emisor.eq.${idUsuarioA},id_receptor.eq.${idUsuarioB}),and(id_emisor.eq.${idUsuarioB},id_receptor.eq.${idUsuarioA})`;
}

export const mensajePrivadoRepository = {
  async crear({ idEmisor, idReceptor, contenido, imagen = null }) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .insert([{ id_emisor: idEmisor, id_receptor: idReceptor, contenido, imagen }])
      .select()
      .single();
    return unwrap(resultado, "Error enviando el mensaje");
  },

  // Igual que mensajeRepository.listarPorGrupo: los ultimos `limite`
  // mensajes en orden cronologico; con `antesDeId` pagina hacia atras.
  async listarConversacion(idUsuarioA, idUsuarioB, { limite = 50, antesDeId } = {}) {
    let query = supabaseAdmin
      .from(TABLA)
      .select("*")
      .or(filtroConversacion(idUsuarioA, idUsuarioB))
      .order("id_mensaje", { ascending: false })
      .limit(limite);

    if (antesDeId) {
      query = query.lt("id_mensaje", antesDeId);
    }

    const resultado = await query;
    const filas = unwrap(resultado, "Error cargando mensajes");
    return filas.reverse();
  },

  // Mensajes recientes en los que participa el usuario (mas nuevos
  // primero), para armar la lista de chats con el ultimo mensaje de cada uno.
  async listarRecientesDeUsuario(idUsuario, limite = 500) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .or(`id_emisor.eq.${idUsuario},id_receptor.eq.${idUsuario}`)
      .order("id_mensaje", { ascending: false })
      .limit(limite);
    return unwrap(resultado, "Error cargando chats");
  },

  async listarNoLeidosDeUsuario(idUsuario) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("id_emisor")
      .eq("id_receptor", idUsuario)
      .eq("leido", false);
    return unwrap(resultado, "Error contando mensajes no leídos");
  },

  async marcarLeidos(idReceptor, idEmisor) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .update({ leido: true })
      .eq("id_receptor", idReceptor)
      .eq("id_emisor", idEmisor)
      .eq("leido", false);
    return unwrap(resultado, "Error marcando mensajes como leídos");
  },
};
