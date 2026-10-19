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

  // Lo usa authMiddleware en cada request: solo trae lo necesario.
  async obtenerEstadoYRol(idUsuario) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("estado, rol")
      .eq("id_usuario", idUsuario)
      .maybeSingle();
    return unwrap(resultado, "Error cargando estado del usuario");
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

  // Igual que listarPorIds pero sin los suspendidos: para todo lo que un fan
  // ve de otros fans (asistentes, integrantes, amigos). Un suspendido no
  // tiene que aparecer en ningún lado de la app.
  async listarActivosPorIds(idsUsuario) {
    if (idsUsuario.length === 0) return [];
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("*")
      .in("id_usuario", idsUsuario)
      .neq("estado", "suspendido");
    return unwrap(resultado, "Error cargando usuarios");
  },

  // Buscador de perfiles: por usuario (@nombre) o apodo, sin suspendidos
  // ni la propia cuenta.
  async buscarActivos(texto, idExcluido, limite = 20) {
    // Comas y paréntesis romperían el .or() de PostgREST; % y _ son comodines.
    const limpio = texto.replace(/[,()%_\\*]/g, " ").trim();
    if (!limpio) return [];
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("id_usuario, nombre, apodo, fotoperfil, fechanac")
      .or(`nombre.ilike.%${limpio}%,apodo.ilike.%${limpio}%`)
      .neq("estado", "suspendido")
      .neq("id_usuario", idExcluido)
      .order("nombre")
      .limit(limite);
    return unwrap(resultado, "Error buscando usuarios");
  },

  // Para descontar a los suspendidos de los contadores (son pocos).
  async listarIdsSuspendidos() {
    const resultado = await supabaseAdmin.from(TABLA).select("id_usuario").eq("estado", "suspendido");
    return new Set(unwrap(resultado, "Error cargando suspendidos").map((f) => f.id_usuario));
  },

  // Todos los usuarios activos (para "Descubrir"): solo lo que se muestra en la lista.
  async listarTodos() {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("id_usuario, nombre, apodo, fotoperfil, fechanac, estilo_asistencia")
      .neq("estado", "suspendido");
    return unwrap(resultado, "Error cargando usuarios");
  },

  // Mismo texto de error que hoy usa App.jsx::manejarFinalizarRegistro.
  // "Ana" y "ana" serían el mismo @ para la gente: se compara sin
  // mayúsculas. En ilike "_" y "%" son comodines, así que se escapan.
  async existeNombreSinMayusculas(nombre, idExcluido) {
    const patron = nombre.replace(/[\\%_]/g, (c) => `\\${c}`);
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("id_usuario")
      .ilike("nombre", patron)
      .neq("id_usuario", idExcluido)
      .limit(1);
    return unwrap(resultado, "Error verificando nombre de usuario").length > 0;
  },

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
