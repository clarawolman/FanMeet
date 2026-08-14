// Reproduce el objeto que hoy arma App.jsx::cargarConciertoPorId, para que
// el frontend pueda consumir /api/conciertos/:id sin cambiar sus componentes.
export function toConciertoDetalle(row, { artista, estadio, grupos = [], usuarios = [] } = {}) {
  if (!row) return null;

  return {
    ...row,
    artista: artista || { id_artista: row.id_artista, nombre: "Artista" },
    estadio: {
      ...(estadio || {
        id_estadio: row.id_estadio,
        nombre: "Estadio",
        direccion: "",
        ciudad: "",
      }),
      imagen: estadio?.imagen || estadio?.venueImage || estadio?.foto || "",
    },
    imagen: row.imagen || row.imagenConcierto || row.foto || "",
    hora: row.hora || "",
    grupos,
    usuarios,
    asistentes: usuarios.length,
    cantidadFans: usuarios.length,
  };
}

// Forma resumida para listados (Home.jsx, MisEventos.jsx): concierto + joins
// embebidos de artista/estadio, sin grupos/usuarios.
export function toConciertoResumen(row) {
  if (!row) return null;
  return {
    ...row,
    imagen: row.imagen || row.imagenConcierto || row.foto || "",
  };
}
