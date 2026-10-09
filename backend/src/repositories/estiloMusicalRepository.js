import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";
import { ApiError } from "../helpers/ApiError.js";

// Sin supabase/generos.sql el backend no tiene permiso de insertar acá.
function sinPermiso(error) {
  return /permission denied/.test(error?.message || "");
}

const ERROR_SIN_PERMISO =
  "Por ahora no se pueden sumar géneros nuevos. Elegí uno de los sugeridos o probá más tarde.";

export const estiloMusicalRepository = {
  async listarCatalogo() {
    const resultado = await supabaseAdmin.from("estilo_musical").select("*");
    return unwrap(resultado, "Error cargando catálogo de géneros musicales");
  },

  // El id es identity. Insertar requiere los permisos de supabase/generos.sql.
  async crear(nombre) {
    const resultado = await supabaseAdmin
      .from("estilo_musical")
      .insert([{ nombre }])
      .select()
      .single();
    if (sinPermiso(resultado.error)) {
      console.error("estilo_musical sin permiso de insert: falta correr supabase/generos.sql");
      throw new ApiError(503, ERROR_SIN_PERMISO);
    }
    return unwrap(resultado, "Error guardando el género");
  },

  // Todas las elecciones de todos los usuarios (para el matching).
  async listarTodasLasSelecciones() {
    const resultado = await supabaseAdmin
      .from("estilo_musical_usuario")
      .select("id_usuario, id_estilo");
    return unwrap(resultado, "Error cargando géneros de los usuarios");
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
