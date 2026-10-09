import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

const TABLA = "reporte";

export const reporteRepository = {
  async crear({ idReportante, idReportado, idGrupo = null, motivo }) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .insert([{ id_reportante: idReportante, id_reportado: idReportado, id_grupo: idGrupo, motivo }])
      .select()
      .single();
    return unwrap(resultado, "Error guardando el reporte");
  },

  // Un mismo usuario no junta varios reportes pendientes contra la misma
  // persona: si ya hay uno sin resolver, se reusa.
  async obtenerPendiente(idReportante, idReportado) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("id_reportante", idReportante)
      .eq("id_reportado", idReportado)
      .eq("estado", "pendiente")
      .limit(1)
      .maybeSingle();
    return unwrap(resultado, "Error buscando reportes");
  },

  async obtenerPorId(idReporte) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("id_reporte", idReporte)
      .maybeSingle();
    return unwrap(resultado, "Error cargando el reporte");
  },

  async listar({ estado } = {}) {
    let query = supabaseAdmin.from(TABLA).select("*").order("created_at", { ascending: false });
    if (estado) query = query.eq("estado", estado);
    const resultado = await query;
    return unwrap(resultado, "Error cargando reportes");
  },

  async listarDeUsuario(idUsuario) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .or(`id_reportado.eq.${idUsuario},id_reportante.eq.${idUsuario}`)
      .order("created_at", { ascending: false });
    return unwrap(resultado, "Error cargando reportes del usuario");
  },

  async resolver(idReporte, { estado, resolucion, idModerador }) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .update({
        estado,
        resolucion,
        id_moderador: idModerador,
        resuelto_at: new Date().toISOString(),
      })
      .eq("id_reporte", idReporte)
      .select()
      .single();
    return unwrap(resultado, "Error resolviendo el reporte");
  },

  async contarPendientes() {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("*", { count: "exact", head: true })
      .eq("estado", "pendiente");
    if (resultado.error) throw new Error(`Error contando reportes: ${resultado.error.message}`);
    return resultado.count || 0;
  },
};
