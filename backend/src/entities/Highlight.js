// Un momento funciona como una publicación de Instagram. Dos formas:
// resumen para la grilla del perfil y detalle para la pantalla del momento.

const contar = (embebido) => embebido?.[0]?.count ?? 0;

// participantes: usuarios (resumen) que lo tienen en su perfil, el autor primero.
// mostrarLikes: false si el autor ocultó la cantidad y quien mira no es participante.
export function toMomentoResumen(row, { participantes = [], mostrarLikes = true, concierto = null } = {}) {
  if (!row) return null;
  return {
    id_highlight: row.id_highlight,
    id_usuario: row.id_usuario,
    url_imagen: row.url_imagen,
    descripcion: row.descripcion || "",
    concierto,
    created_at: row.created_at,
    participantes,
    cantidadFotos: Math.max(1, contar(row.highlight_foto)),
    cantidadLikes: mostrarLikes ? contar(row.highlight_like) : null,
    cantidadComentarios: contar(row.highlight_comentario),
    fijado: Boolean(row.fijado_at),
  };
}

export function toMomentoDetalle(
  row,
  { participantes, concierto, comentarios, cantidadLikes, yoDiLike, guardado, soyAutor, soyParticipante, fijado }
) {
  const fotos = [...(row.highlight_foto || [])]
    .sort((a, b) => a.orden - b.orden)
    .map((f) => f.url_imagen);

  return {
    id_highlight: row.id_highlight,
    id_usuario: row.id_usuario,
    // momentos viejos (antes del carrusel) tienen solo url_imagen
    fotos: fotos.length > 0 ? fotos : [row.url_imagen],
    descripcion: row.descripcion || "",
    concierto,
    participantes,
    created_at: row.created_at,
    editado: Boolean(row.editado_at),
    comentariosActivados: row.comentarios_activados !== false,
    ocultarLikes: Boolean(row.ocultar_likes),
    cantidadLikes,
    yoDiLike,
    guardado,
    soyAutor,
    soyParticipante,
    fijado,
    comentarios,
  };
}
