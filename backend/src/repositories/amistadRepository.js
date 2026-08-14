import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

export const amistadRepository = {
  async buscarEntreUsuarios(idUsuarioA, idUsuarioB) {
    const resultado = await supabaseAdmin
      .from("amistad")
      .select("*")
      .or(
        `and(id_solicitante.eq.${idUsuarioA},id_receptor.eq.${idUsuarioB}),and(id_solicitante.eq.${idUsuarioB},id_receptor.eq.${idUsuarioA})`
      )
      .maybeSingle();
    return unwrap(resultado, "Error cargando estado de amistad");
  },

  async obtenerPorId(idAmistad) {
    const resultado = await supabaseAdmin
      .from("amistad")
      .select("*")
      .eq("id_amistad", idAmistad)
      .maybeSingle();
    return unwrap(resultado, "Error cargando amistad");
  },

  async crear(idSolicitante, idReceptor) {
    const resultado = await supabaseAdmin
      .from("amistad")
      .insert([{ id_solicitante: idSolicitante, id_receptor: idReceptor }])
      .select()
      .single();
    return unwrap(resultado, "Error enviando solicitud de amistad");
  },

  async actualizarEstado(idAmistad, estado) {
    const resultado = await supabaseAdmin
      .from("amistad")
      .update({ estado })
      .eq("id_amistad", idAmistad)
      .select()
      .single();
    return unwrap(resultado, "Error actualizando amistad");
  },

  async eliminar(idAmistad) {
    const resultado = await supabaseAdmin.from("amistad").delete().eq("id_amistad", idAmistad);
    return unwrap(resultado, "Error eliminando amistad");
  },

  async listarAceptadasDeUsuario(idUsuario) {
    const resultado = await supabaseAdmin
      .from("amistad")
      .select("*")
      .eq("estado", "aceptada")
      .or(`id_solicitante.eq.${idUsuario},id_receptor.eq.${idUsuario}`);
    return unwrap(resultado, "Error cargando amigos");
  },

  // Mismo patron que perfil.jsx::cargarEstadisticas para el contador "Amigos".
  async contarAceptadasDeUsuario(idUsuario) {
    const { count, error } = await supabaseAdmin
      .from("amistad")
      .select("*", { count: "exact", head: true })
      .eq("estado", "aceptada")
      .or(`id_solicitante.eq.${idUsuario},id_receptor.eq.${idUsuario}`);
    if (error) throw new Error(`Error contando amigos: ${error.message}`);
    return count || 0;
  },
};
