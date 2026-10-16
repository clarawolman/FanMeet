import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

// Consultas que solo usa el backoffice (ver todo, sin filtrar por usuario).
// La autorización (ser moderador) la hacen las rutas antes de llegar acá.
export const backofficeRepository = {
  async contar(tabla, filtro) {
    let query = supabaseAdmin.from(tabla).select("*", { count: "exact", head: true });
    if (filtro) query = query.eq(filtro.columna, filtro.valor);
    const resultado = await query;
    if (resultado.error) throw new Error(`Error contando ${tabla}: ${resultado.error.message}`);
    return resultado.count || 0;
  },

  async listarUsuarios({ busqueda, estado } = {}) {
    let query = supabaseAdmin
      .from("usuario")
      .select("id_usuario, nombre, mail, fotoperfil, estado, rol, motivo_suspension, suspendido_at")
      .order("nombre");
    if (estado) query = query.eq("estado", estado);
    if (busqueda) {
      // Las comas y paréntesis romperían el filtro .or() de PostgREST.
      const texto = busqueda.replace(/[,()%]/g, " ").trim();
      if (texto) query = query.or(`nombre.ilike.%${texto}%,mail.ilike.%${texto}%`);
    }
    const resultado = await query;
    return unwrap(resultado, "Error cargando usuarios");
  },

  async cambiarEstadoUsuario(idUsuario, { estado, motivo }) {
    const suspendido = estado === "suspendido";
    const resultado = await supabaseAdmin
      .from("usuario")
      .update({
        estado,
        motivo_suspension: suspendido ? motivo : null,
        suspendido_at: suspendido ? new Date().toISOString() : null,
      })
      .eq("id_usuario", idUsuario)
      .select()
      .single();
    return unwrap(resultado, "Error cambiando el estado del usuario");
  },

  // Además del estado en la tabla "usuario", se banea la cuenta en Supabase
  // Auth: así tampoco puede renovar la sesión ni loguearse por otro lado.
  async banearEnAuth(idUsuario, baneado) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(idUsuario, {
      ban_duration: baneado ? "876000h" : "none",
    });
    if (error) throw new Error(`Error actualizando la cuenta en Auth: ${error.message}`);
  },

  async listarConciertos() {
    const resultado = await supabaseAdmin
      .from("concierto")
      .select("*, artista(*), estadio(*), grupo(count), usuarios_conciertos(count)")
      .order("fecha", { ascending: false });
    return unwrap(resultado, "Error cargando conciertos");
  },

  async crearConcierto(datos) {
    const resultado = await supabaseAdmin.from("concierto").insert([datos]).select().single();
    return unwrap(resultado, "Error creando el concierto");
  },

  async actualizarConcierto(idConcierto, cambios) {
    const resultado = await supabaseAdmin
      .from("concierto")
      .update(cambios)
      .eq("id_concierto", idConcierto)
      .select()
      .maybeSingle();
    return unwrap(resultado, "Error actualizando el concierto");
  },

  async listarArtistas() {
    const resultado = await supabaseAdmin.from("artista").select("*").order("nombre");
    return unwrap(resultado, "Error cargando artistas");
  },

  async obtenerOCrearArtista(nombre) {
    const existente = await supabaseAdmin
      .from("artista")
      .select("*")
      // ilike sin comodines = igual sin importar mayúsculas.
      .ilike("nombre", nombre.replace(/[%_\\]/g, "\\$&"))
      .limit(1)
      .maybeSingle();
    const fila = unwrap(existente, "Error buscando artista");
    if (fila) return fila;

    const resultado = await supabaseAdmin.from("artista").insert([{ nombre }]).select().single();
    return unwrap(resultado, "Error creando artista");
  },

  async listarEstadios() {
    const resultado = await supabaseAdmin.from("estadio").select("*").order("nombre");
    return unwrap(resultado, "Error cargando estadios");
  },

  async listarGrupos() {
    const resultado = await supabaseAdmin
      .from("grupo")
      .select("*, concierto(nombre), grupos_usuarios(count), mensaje_grupo(count)")
      .order("id_grupo", { ascending: false });
    return unwrap(resultado, "Error cargando grupos");
  },

  async crearNotificaciones(filas) {
    if (filas.length === 0) return;
    const resultado = await supabaseAdmin.from("notificacion").insert(filas);
    unwrap(resultado, "Error creando notificaciones");
  },
};
