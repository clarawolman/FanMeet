import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

// Un momento es una publicación (tabla highlight) con sus fotos, quiénes
// lo tienen en su perfil (highlight_usuario), me gusta, comentarios y
// guardados. Ver supabase/perfil_momentos.sql y momentos_publicaciones.sql.

// Lo que hace falta para la grilla del perfil
const RESUMEN =
  "*, highlight_usuario(id_usuario, estado), highlight_foto(count), highlight_like(count), highlight_comentario(count)";

export const highlightRepository = {
  // Momentos que la persona aceptó (los propios y los que comparte), con
  // cuándo los fijó.
  async listarPorUsuario(idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight_usuario")
      .select(`created_at, fijado_at, highlight(${RESUMEN})`)
      .eq("id_usuario", idUsuario)
      .eq("estado", "aceptado")
      .order("created_at", { ascending: false });
    return unwrap(resultado, "Error cargando momentos").map((fila) => ({
      ...fila.highlight,
      fijado_at: fila.fijado_at,
    }));
  },

  async listarGuardados(idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight_guardado")
      .select(`created_at, highlight(${RESUMEN})`)
      .eq("id_usuario", idUsuario)
      .order("created_at", { ascending: false });
    return unwrap(resultado, "Error cargando guardados").map((fila) => fila.highlight);
  },

  async obtenerDetalle(idHighlight) {
    const resultado = await supabaseAdmin
      .from("highlight")
      .select("*, highlight_foto(id_foto, url_imagen, orden), highlight_usuario(id_usuario, estado, fijado_at)")
      .eq("id_highlight", idHighlight)
      .maybeSingle();
    return unwrap(resultado, "Error cargando momento");
  },

  async obtenerPorId(idHighlight) {
    const resultado = await supabaseAdmin
      .from("highlight")
      .select("*")
      .eq("id_highlight", idHighlight)
      .maybeSingle();
    return unwrap(resultado, "Error cargando momento");
  },

  async crear(datos) {
    const resultado = await supabaseAdmin.from("highlight").insert([datos]).select().single();
    return unwrap(resultado, "Error guardando momento");
  },

  async actualizar(idHighlight, cambios) {
    const resultado = await supabaseAdmin
      .from("highlight")
      .update(cambios)
      .eq("id_highlight", idHighlight)
      .select()
      .single();
    return unwrap(resultado, "Error editando momento");
  },

  async eliminar(idHighlight) {
    const resultado = await supabaseAdmin.from("highlight").delete().eq("id_highlight", idHighlight);
    return unwrap(resultado, "Error borrando momento");
  },

  async agregarFotos(idHighlight, urls) {
    const filas = urls.map((url_imagen, orden) => ({ id_highlight: idHighlight, url_imagen, orden }));
    const resultado = await supabaseAdmin.from("highlight_foto").insert(filas);
    return unwrap(resultado, "Error guardando las fotos");
  },

  async listarFotos(idHighlight) {
    const resultado = await supabaseAdmin
      .from("highlight_foto")
      .select("url_imagen")
      .eq("id_highlight", idHighlight);
    return unwrap(resultado, "Error cargando fotos");
  },

  // ── Quiénes lo tienen en su perfil ──────────────────────────────────────
  // [{ id_usuario, estado }]
  async agregarParticipantes(idHighlight, participantes) {
    const filas = participantes.map((p) => ({ id_highlight: idHighlight, ...p }));
    const resultado = await supabaseAdmin.from("highlight_usuario").insert(filas);
    return unwrap(resultado, "Error etiquetando en el momento");
  },

  async obtenerParticipacion(idHighlight, idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight_usuario")
      .select("*")
      .eq("id_highlight", idHighlight)
      .eq("id_usuario", idUsuario)
      .maybeSingle();
    return unwrap(resultado, "Error cargando momento");
  },

  async aceptarParticipacion(idHighlight, idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight_usuario")
      .update({ estado: "aceptado", created_at: new Date().toISOString() })
      .eq("id_highlight", idHighlight)
      .eq("id_usuario", idUsuario);
    return unwrap(resultado, "Error aceptando el momento");
  },

  async quitarParticipacion(idHighlight, idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight_usuario")
      .delete()
      .eq("id_highlight", idHighlight)
      .eq("id_usuario", idUsuario);
    return unwrap(resultado, "Error quitando el momento");
  },

  async contarParticipantes(idHighlight) {
    const { count, error } = await supabaseAdmin
      .from("highlight_usuario")
      .select("*", { count: "exact", head: true })
      .eq("id_highlight", idHighlight);
    if (error) throw new Error(`Error contando participantes: ${error.message}`);
    return count || 0;
  },

  // fecha null = desfijar
  async fijar(idHighlight, idUsuario, fecha) {
    const resultado = await supabaseAdmin
      .from("highlight_usuario")
      .update({ fijado_at: fecha })
      .eq("id_highlight", idHighlight)
      .eq("id_usuario", idUsuario);
    return unwrap(resultado, "Error fijando el momento");
  },

  async contarFijados(idUsuario) {
    const { count, error } = await supabaseAdmin
      .from("highlight_usuario")
      .select("*", { count: "exact", head: true })
      .eq("id_usuario", idUsuario)
      .eq("estado", "aceptado")
      .not("fijado_at", "is", null);
    if (error) throw new Error(`Error contando fijados: ${error.message}`);
    return count || 0;
  },

  // ── Me gusta ───────────────────────────────────────────────────────────
  async listarLikes(idHighlight) {
    const resultado = await supabaseAdmin
      .from("highlight_like")
      .select("id_usuario, created_at")
      .eq("id_highlight", idHighlight)
      .order("created_at", { ascending: false });
    return unwrap(resultado, "Error cargando me gusta");
  },

  // upsert: tocar dos veces rápido no rompe
  async darLike(idHighlight, idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight_like")
      .upsert([{ id_highlight: idHighlight, id_usuario: idUsuario }], { ignoreDuplicates: true });
    return unwrap(resultado, "Error dando me gusta");
  },

  async quitarLike(idHighlight, idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight_like")
      .delete()
      .eq("id_highlight", idHighlight)
      .eq("id_usuario", idUsuario);
    return unwrap(resultado, "Error quitando me gusta");
  },

  // ── Comentarios ────────────────────────────────────────────────────────
  async listarComentarios(idHighlight) {
    const resultado = await supabaseAdmin
      .from("highlight_comentario")
      .select("*, highlight_comentario_like(id_usuario)")
      .eq("id_highlight", idHighlight)
      .order("created_at", { ascending: true })
      .limit(500);
    return unwrap(resultado, "Error cargando comentarios");
  },

  async obtenerComentario(idComentario) {
    const resultado = await supabaseAdmin
      .from("highlight_comentario")
      .select("*")
      .eq("id_comentario", idComentario)
      .maybeSingle();
    return unwrap(resultado, "Error cargando comentario");
  },

  async crearComentario(datos) {
    const resultado = await supabaseAdmin
      .from("highlight_comentario")
      .insert([datos])
      .select()
      .single();
    return unwrap(resultado, "Error comentando");
  },

  async eliminarComentario(idComentario) {
    const resultado = await supabaseAdmin
      .from("highlight_comentario")
      .delete()
      .eq("id_comentario", idComentario);
    return unwrap(resultado, "Error borrando comentario");
  },

  async darLikeComentario(idComentario, idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight_comentario_like")
      .upsert([{ id_comentario: idComentario, id_usuario: idUsuario }], { ignoreDuplicates: true });
    return unwrap(resultado, "Error dando me gusta al comentario");
  },

  async quitarLikeComentario(idComentario, idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight_comentario_like")
      .delete()
      .eq("id_comentario", idComentario)
      .eq("id_usuario", idUsuario);
    return unwrap(resultado, "Error quitando me gusta al comentario");
  },

  // ── Guardados ──────────────────────────────────────────────────────────
  async estaGuardado(idHighlight, idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight_guardado")
      .select("id_usuario")
      .eq("id_highlight", idHighlight)
      .eq("id_usuario", idUsuario)
      .maybeSingle();
    return Boolean(unwrap(resultado, "Error cargando guardado"));
  },

  async guardar(idHighlight, idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight_guardado")
      .upsert([{ id_highlight: idHighlight, id_usuario: idUsuario }], { ignoreDuplicates: true });
    return unwrap(resultado, "Error guardando");
  },

  async quitarGuardado(idHighlight, idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight_guardado")
      .delete()
      .eq("id_highlight", idHighlight)
      .eq("id_usuario", idUsuario);
    return unwrap(resultado, "Error quitando de guardados");
  },
};
