import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

export const estiloMusicalRepository = {
  async listarCatalogo() {
    const resultado = await supabaseAdmin.from("estilo_musical").select("*");
    return unwrap(resultado, "Error cargando catálogo de géneros musicales");
  },

  async listarIdsPorUsuario(idUsuario) {
    const resultado = await supabaseAdmin
      .from("estilo_musical_usuario")
      .select("id_estilo")
      .eq("id_usuario", idUsuario);
    return unwrap(resultado, "Error cargando géneros del usuario");
  },

  // Mismo patron que hoy usa EditarGeneros.jsx: reemplazo total (delete + insert),
  // no es un upsert incremental.
  async reemplazarSeleccion(idUsuario, idsEstilos) {
    const eliminar = await supabaseAdmin
      .from("estilo_musical_usuario")
      .delete()
      .eq("id_usuario", idUsuario);
    unwrap(eliminar, "Error limpiando géneros previos");

    const filas = idsEstilos.map((idEstilo) => ({ id_usuario: idUsuario, id_estilo: idEstilo }));
    const insertar = await supabaseAdmin.from("estilo_musical_usuario").insert(filas);
    return unwrap(insertar, "Error guardando géneros");
  },
};
