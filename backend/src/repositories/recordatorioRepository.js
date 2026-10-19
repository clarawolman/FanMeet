import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

// Registro de recordatorios del día del show (ver supabase/recordatorio_concierto.sql).
const TABLA = "recordatorio_concierto";

export const recordatorioRepository = {
  // "Reserva" los recordatorios: inserta las filas que no existían y
  // devuelve solo esas. Las que ya estaban (ya se mandaron) se ignoran, así
  // que dos chequeos a la vez nunca mandan el mismo recordatorio.
  async reservar(filas) {
    if (filas.length === 0) return [];
    const resultado = await supabaseAdmin
      .from(TABLA)
      .upsert(filas, { onConflict: "id_concierto,id_usuario,fecha", ignoreDuplicates: true })
      .select("id_usuario");
    return unwrap(resultado, "Error registrando recordatorios");
  },

  // Si no se pudo crear la notificación, se libera la reserva para que el
  // próximo chequeo lo vuelva a intentar.
  async liberar(idConcierto, fecha, idsUsuario) {
    if (idsUsuario.length === 0) return;
    const resultado = await supabaseAdmin
      .from(TABLA)
      .delete()
      .eq("id_concierto", idConcierto)
      .eq("fecha", fecha)
      .in("id_usuario", idsUsuario);
    unwrap(resultado, "Error liberando recordatorios");
  },
};
