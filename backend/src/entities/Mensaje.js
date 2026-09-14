import { FOTO_PERFIL_DEFAULT } from "../helpers/constants.js";

// Misma forma que toGrupo/toNotificacion: la fila de "mensaje_grupo" mas un
// resumen del usuario que lo mando (nombre + foto), para que el chat no
// tenga que pedir el perfil de cada emisor por separado.
export function toMensaje(row, { usuario } = {}) {
  if (!row) return null;
  return {
    id_mensaje: row.id_mensaje,
    id_grupo: row.id_grupo,
    id_usuario: row.id_usuario,
    contenido: row.contenido,
    created_at: row.created_at,
    usuario: usuario
      ? {
          id_usuario: usuario.id_usuario,
          nombre: usuario.nombre || "Usuario",
          foto_perfil: usuario.fotoperfil || usuario.foto_perfil || FOTO_PERFIL_DEFAULT,
        }
      : null,
  };
}
