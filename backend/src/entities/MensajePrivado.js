export function toMensajePrivado(row) {
  if (!row) return null;
  return {
    id_mensaje: row.id_mensaje,
    id_emisor: row.id_emisor,
    id_receptor: row.id_receptor,
    contenido: row.contenido || "",
    imagen: row.imagen || null,
    leido: row.leido,
    created_at: row.created_at,
  };
}
