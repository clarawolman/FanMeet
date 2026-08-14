import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

export const conciertoRepository = {
  async listarTodos() {
    const resultado = await supabaseAdmin.from("concierto").select("*, artista(*), estadio(*)");
    return unwrap(resultado, "Error cargando conciertos");
  },

  async obtenerPorId(idConcierto) {
    const resultado = await supabaseAdmin
      .from("concierto")
      .select("*")
      .eq("id_concierto", idConcierto)
      .maybeSingle();
    return unwrap(resultado, "Error cargando concierto");
  },

  async obtenerArtista(idArtista) {
    const resultado = await supabaseAdmin
      .from("artista")
      .select("*")
      .eq("id_artista", idArtista)
      .maybeSingle();
    return unwrap(resultado, "Error cargando artista");
  },

  async obtenerEstadio(idEstadio) {
    const resultado = await supabaseAdmin
      .from("estadio")
      .select("*")
      .eq("id_estadio", idEstadio)
      .maybeSingle();
    return unwrap(resultado, "Error cargando estadio");
  },
};

export const usuariosConciertosRepository = {
  async existeRelacion(idUsuario, idConcierto) {
    const resultado = await supabaseAdmin
      .from("usuarios_conciertos")
      .select("*")
      .eq("id_usuario", idUsuario)
      .eq("id_concierto", idConcierto)
      .maybeSingle();
    return unwrap(resultado, "Error verificando inscripción al concierto");
  },

  async crearRelacion(idUsuario, idConcierto) {
    const resultado = await supabaseAdmin
      .from("usuarios_conciertos")
      .insert([{ id_usuario: idUsuario, id_concierto: idConcierto }]);
    return unwrap(resultado, "Error uniéndose al concierto");
  },

  async eliminarRelacion(idUsuario, idConcierto) {
    const resultado = await supabaseAdmin
      .from("usuarios_conciertos")
      .delete()
      .eq("id_usuario", idUsuario)
      .eq("id_concierto", idConcierto);
    return unwrap(resultado, "Error saliendo del concierto");
  },

  async listarConciertosPorUsuario(idUsuario) {
    const resultado = await supabaseAdmin
      .from("usuarios_conciertos")
      .select("id_concierto")
      .eq("id_usuario", idUsuario);
    return unwrap(resultado, "Error cargando mis eventos");
  },

  async listarUsuariosPorConcierto(idConcierto) {
    const resultado = await supabaseAdmin
      .from("usuarios_conciertos")
      .select("id_usuario")
      .eq("id_concierto", idConcierto);
    return unwrap(resultado, "Error cargando asistentes del concierto");
  },

  // Mismo patron que usa hoy perfil.jsx::cargarEstadisticas (count exacto,
  // sin traer filas) para el contador "Conciertos" del perfil.
  async contarPorUsuario(idUsuario) {
    const { count, error } = await supabaseAdmin
      .from("usuarios_conciertos")
      .select("*", { count: "exact", head: true })
      .eq("id_usuario", idUsuario);
    if (error) throw new Error(`Error contando conciertos: ${error.message}`);
    return count || 0;
  },
};
