import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

const TABLA = "notificacion";

export const notificacionRepository = {
  async crear(datos) {
    const resultado = await supabaseAdmin.from(TABLA).insert([datos]);
    return unwrap(resultado, "Error creando notificación");
  },

  async listarPorUsuario(idUsuario) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("id_usuario", idUsuario)
      .order("created_at", { ascending: false });
    return unwrap(resultado, "Error cargando notificaciones");
  },

  async contarNoLeidas(idUsuario) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("*", { count: "exact", head: true })
      .eq("id_usuario", idUsuario)
      .eq("leida", false);
    if (resultado.error) {
      throw new Error(`Error contando notificaciones: ${resultado.error.message}`);
    }
    return resultado.count || 0;
  },

  // Siempre incluye id_usuario en el filtro: nunca hay que confiar en que
  // el id_notificacion que manda el cliente ya sea "seguro" de por si.
  async marcarLeidas(idUsuario, ids) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .update({ leida: true })
      .eq("id_usuario", idUsuario)
      .in("id_notificacion", ids)
      .select();
    return unwrap(resultado, "Error marcando notificaciones como leídas");
  },

  async eliminar(idUsuario, idNotificacion) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .delete()
      .eq("id_usuario", idUsuario)
      .eq("id_notificacion", idNotificacion)
      .select();
    return unwrap(resultado, "Error eliminando notificación");
  },
};
