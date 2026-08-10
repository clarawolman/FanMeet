export function toHighlight(row) {
  if (!row) return null;
  return {
    id_highlight: row.id_highlight,
    id_usuario: row.id_usuario,
    url_imagen: row.url_imagen,
    created_at: row.created_at,
  };
}
