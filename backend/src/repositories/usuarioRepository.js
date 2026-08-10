import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

const TABLA = "usuario";

export const usuarioRepository = {
  async obtenerPorId(idUsuario) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .eq("id_usuario", idUsuario)
      .maybeSingle();
    return unwrap(resultado, "Error cargando usuario");
  },

  async obtenerMailPorNombre(nombre) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("mail")
      .eq("nombre", nombre)
      .maybeSingle();
    return unwrap(resultado, "Error buscando usuario por nombre");
  },

  async existeMail(mail) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("id_usuario")
      .eq("mail", mail)
      .maybeSingle();
    return unwrap(resultado, "Error verificando mail");
  },

  async existeNombre(nombre) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("id_usuario")
      .eq("nombre", nombre)
      .maybeSingle();
    return unwrap(resultado, "Error verificando nombre de usuario");
  },

  async listarPorIds(idsUsuario) {
    if (idsUsuario.length === 0) return [];
    const resultado = await supabaseAdmin.from(TABLA).select("*").in("id_usuario", idsUsuario);
    return unwrap(resultado, "Error cargando usuarios");
  },

  // Mismo texto de error que hoy usa App.jsx::manejarFinalizarRegistro.
  async crear(datosUsuario) {
    const resultado = await supabaseAdmin.from(TABLA).insert([datosUsuario]).select().single();
    return unwrap(resultado, "Error al registrar usuario");
  },

  async actualizar(idUsuario, cambios) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .update(cambios)
      .eq("id_usuario", idUsuario)
      .select()
      .single();
    return unwrap(resultado, "Error actualizando usuario");
  },
};
