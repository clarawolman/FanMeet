export function toNotificacion(row) {
  if (!row) return null;
  return {
    id_notificacion: row.id_notificacion,
    id_usuario: row.id_usuario,
    tipo: row.tipo,
    titulo: row.titulo,
    descripcion: row.descripcion,
    imagen: row.imagen,
    id_concierto: row.id_concierto,
    id_grupo: row.id_grupo,
    id_usuario_relacionado: row.id_usuario_relacionado,
    id_amistad: row.id_amistad,
    leida: row.leida,
    created_at: row.created_at,
  };
}
