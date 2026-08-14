import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

export const highlightRepository = {
  async listarPorUsuario(idUsuario) {
    const resultado = await supabaseAdmin
      .from("highlight")
      .select("*")
      .eq("id_usuario", idUsuario)
      .order("created_at", { ascending: false });
    return unwrap(resultado, "Error cargando highlights");
  },

  async crear(idUsuario, urlImagen) {
    const resultado = await supabaseAdmin
      .from("highlight")
      .insert([{ id_usuario: idUsuario, url_imagen: urlImagen }])
      .select()
      .single();
    return unwrap(resultado, "Error guardando highlight");
  },
};
