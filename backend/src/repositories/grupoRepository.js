import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

export const grupoRepository = {
  async crear(datosGrupo) {
    const resultado = await supabaseAdmin.from("grupo").insert([datosGrupo]).select().single();
    return unwrap(resultado, "Error creando grupo");
  },

  async obtenerPorId(idGrupo) {
    const resultado = await supabaseAdmin
      .from("grupo")
      .select("*")
      .eq("id_grupo", idGrupo)
      .maybeSingle();
    return unwrap(resultado, "Error cargando grupo");
  },

  async listarPorConcierto(idConcierto) {
    const resultado = await supabaseAdmin
      .from("grupo")
      .select("*")
      .eq("id_concierto", idConcierto);
    return unwrap(resultado, "Error cargando grupos del concierto");
  },

  async eliminar(idGrupo) {
    const resultado = await supabaseAdmin.from("grupo").delete().eq("id_grupo", idGrupo);
    return unwrap(resultado, "Error eliminando grupo");
  },
};

export const grupoUsuarioRepository = {
  async existeRelacion(idUsuario, idGrupo) {
    const resultado = await supabaseAdmin
      .from("grupos_usuarios")
      .select("*")
      .eq("id_usuario", idUsuario)
      .eq("id_grupo", idGrupo)
      .maybeSingle();
    return unwrap(resultado, "Error verificando participación en el grupo");
  },

  async crearRelacion(idUsuario, idGrupo) {
    const resultado = await supabaseAdmin
      .from("grupos_usuarios")
      .insert([{ id_usuario: idUsuario, id_grupo: idGrupo }]);
    return unwrap(resultado, "Error uniéndose al grupo");
  },

  async eliminarRelacion(idUsuario, idGrupo) {
    const resultado = await supabaseAdmin
      .from("grupos_usuarios")
      .delete()
      .eq("id_usuario", idUsuario)
      .eq("id_grupo", idGrupo);
    return unwrap(resultado, "Error saliendo del grupo");
  },

  async eliminarTodosDeGrupo(idGrupo) {
    const resultado = await supabaseAdmin.from("grupos_usuarios").delete().eq("id_grupo", idGrupo);
    return unwrap(resultado, "Error eliminando participantes del grupo");
  },

  async eliminarDeGruposIds(idUsuario, idsGrupo) {
    if (idsGrupo.length === 0) return null;
    const resultado = await supabaseAdmin
      .from("grupos_usuarios")
      .delete()
      .eq("id_usuario", idUsuario)
      .in("id_grupo", idsGrupo);
    return unwrap(resultado, "Error saliendo de los grupos del concierto");
  },

  async listarUsuariosPorGrupo(idGrupo) {
    const resultado = await supabaseAdmin
      .from("grupos_usuarios")
      .select("id_usuario")
      .eq("id_grupo", idGrupo);
    return unwrap(resultado, "Error cargando participantes del grupo");
  },

  async listarGruposPorUsuario(idUsuario) {
    const resultado = await supabaseAdmin
      .from("grupos_usuarios")
      .select("id_grupo")
      .eq("id_usuario", idUsuario);
    return unwrap(resultado, "Error cargando mis grupos");
  },

  // Mismo patron que perfil.jsx::cargarEstadisticas para el contador "Grupos".
  async contarPorUsuario(idUsuario) {
    const { count, error } = await supabaseAdmin
      .from("grupos_usuarios")
      .select("*", { count: "exact", head: true })
      .eq("id_usuario", idUsuario);
    if (error) throw new Error(`Error contando grupos: ${error.message}`);
    return count || 0;
  },
};
