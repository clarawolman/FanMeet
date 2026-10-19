import { supabaseAdmin } from "../config/supabaseClient.js";
import { unwrap } from "../helpers/supabaseResult.js";

// Ver supabase/bloqueos.sql.
const TABLA = "bloqueo";

export const bloqueoRepository = {
  // Bloquear dos veces no es un error: queda el primero.
  async crear(idBloqueador, idBloqueado) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .upsert([{ id_bloqueador: idBloqueador, id_bloqueado: idBloqueado }], {
        onConflict: "id_bloqueador,id_bloqueado",
        ignoreDuplicates: true,
      });
    unwrap(resultado, "Error bloqueando usuario");
  },

  async eliminar(idBloqueador, idBloqueado) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .delete()
      .eq("id_bloqueador", idBloqueador)
      .eq("id_bloqueado", idBloqueado);
    unwrap(resultado, "Error desbloqueando usuario");
  },

  // Los que bloqueó este usuario (para la lista de Configuración).
  async listarBloqueadosPor(idBloqueador) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("id_bloqueado, created_at")
      .eq("id_bloqueador", idBloqueador)
      .order("created_at", { ascending: false });
    return unwrap(resultado, "Error cargando usuarios bloqueados");
  },

  // Con quiénes hay un bloqueo, en cualquiera de los dos sentidos: ni los
  // que bloqueé ni los que me bloquearon tienen que aparecerme.
  async idsConBloqueo(idUsuario) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("id_bloqueador, id_bloqueado")
      .or(`id_bloqueador.eq.${idUsuario},id_bloqueado.eq.${idUsuario}`);
    const filas = unwrap(resultado, "Error cargando bloqueos");
    return new Set(
      filas.map((f) => (f.id_bloqueador === idUsuario ? f.id_bloqueado : f.id_bloqueador))
    );
  },

  async existeEntre(idUsuarioA, idUsuarioB) {
    const resultado = await supabaseAdmin
      .from(TABLA)
      .select("id_bloqueador")
      .or(
        `and(id_bloqueador.eq.${idUsuarioA},id_bloqueado.eq.${idUsuarioB}),and(id_bloqueador.eq.${idUsuarioB},id_bloqueado.eq.${idUsuarioA})`
      )
      .limit(1);
    return unwrap(resultado, "Error verificando bloqueo").length > 0;
  },
};
