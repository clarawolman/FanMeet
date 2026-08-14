export function toAmistad(row) {
  if (!row) return null;
  return {
    id_amistad: row.id_amistad,
    id_solicitante: row.id_solicitante,
    id_receptor: row.id_receptor,
    estado: row.estado,
    created_at: row.created_at,
  };
}

// Mismo calculo de estado que hoy hace perfil.jsx::cargarAmistad, para que
// HeaderPerfil/botonAmistad.jsx reciban exactamente los mismos valores
// ("conectar" | "solicitudEnviada" | "aceptarSolicitud" | "amigos").
export function calcularEstadoAmistad(row, idUsuarioActual) {
  if (!row) return "conectar";
  if (row.estado === "aceptada") return "amigos";
  if (row.id_solicitante === idUsuarioActual) return "solicitudEnviada";
  return "aceptarSolicitud";
}
