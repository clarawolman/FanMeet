import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";
import { usuarioRepository } from "./usuarioRepository.js";
import { hoyEnArgentina } from "../helpers/fechas.js";

export const conciertoRepository = {
  // usuarios_conciertos(count) contaría también a los suspendidos, así que
  // se traen los ids y se cuentan solo los activos, devolviendo la misma
  // forma [{ count }] que espera toConciertoResumen.
  // soloProximos: sin los que ya pasaron (desde hoy, ver helpers/fechas.js).
  async listarTodos({ soloProximos = false } = {}) {
    let consulta = supabaseAdmin
      .from("concierto")
      .select("*, artista(*), estadio(*), grupo(count), usuarios_conciertos(id_usuario)");
    if (soloProximos) consulta = consulta.gte("fecha", hoyEnArgentina());

    const [resultado, suspendidos] = await Promise.all([
      consulta,
      usuarioRepository.listarIdsSuspendidos(),
    ]);
    return unwrap(resultado, "Error cargando conciertos").map((fila) => ({
      ...fila,
      usuarios_conciertos: [
        { count: (fila.usuarios_conciertos || []).filter((u) => !suspendidos.has(u.id_usuario)).length },
      ],
    }));
  },

  // Todas las fechas de un artista en un estadio (para armar las fechas
  // seguidas de los grupos generales, ver helpers/gruposGenerales.js).
  async listarDeArtistaYEstadio(idArtista, idEstadio) {
    const resultado = await supabaseAdmin
      .from("concierto")
      .select("id_concierto, id_artista, id_estadio, fecha")
      .eq("id_artista", idArtista)
      .eq("id_estadio", idEstadio);
    return unwrap(resultado, "Error cargando las fechas del artista");
  },

  // Los conciertos de un día ("2026-10-19"), con su estadio. La fecha se
  // guarda en hora de Argentina, así que alcanza con comparar el texto.
  async listarDelDia(dia, diaSiguiente) {
    const resultado = await supabaseAdmin
      .from("concierto")
      .select("*, estadio(*)")
      .gte("fecha", dia)
      .lt("fecha", diaSiguiente);
    return unwrap(resultado, "Error cargando los conciertos del día");
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

  // Para los grupos generales: alcanza con estar unido a una de sus fechas.
  async existeRelacionEnAlguno(idUsuario, idsConcierto) {
    const resultado = await supabaseAdmin
      .from("usuarios_conciertos")
      .select("id_concierto")
      .eq("id_usuario", idUsuario)
      .in("id_concierto", idsConcierto)
      .limit(1);
    return unwrap(resultado, "Error verificando inscripción al concierto").length > 0;
  },

  // Quien va a que concierto, de todos los usuarios (para el matching).
  async listarTodas() {
    const resultado = await supabaseAdmin
      .from("usuarios_conciertos")
      .select("id_usuario, id_concierto");
    return unwrap(resultado, "Error cargando asistentes a conciertos");
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
