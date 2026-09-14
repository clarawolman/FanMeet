import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

const TABLA = "mensaje_grupo";

export const mensajeRepository = {
  async crear({ idGrupo, idUsuario, contenido }) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .insert([{ id_grupo: idGrupo, id_usuario: idUsuario, contenido }])
      .select()
      .single();
    return unwrap(resultado, "Error enviando el mensaje");
  },

  // Trae los ultimos `limite` mensajes del grupo (mas nuevos primero para
  // la query) y los devuelve en orden cronologico, que es como el chat los
  // pinta. Con `antesDeId` pagina hacia atras en el historial.
  async listarPorGrupo(idGrupo, { limite = 50, antesDeId } = {}) {
    let query = supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("id_grupo", idGrupo)
      .order("id_mensaje", { ascending: false })
      .limit(limite);

    if (antesDeId) {
      query = query.lt("id_mensaje", antesDeId);
    }

    const resultado = await query;
    const filas = unwrap(resultado, "Error cargando mensajes del grupo");
    return filas.reverse();
  },
};
