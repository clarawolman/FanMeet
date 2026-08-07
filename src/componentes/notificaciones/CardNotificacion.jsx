import "./CardNotificacion.css";

function formatearTiempo(fecha) {
  if (!fecha) return "";

  const creada = new Date(fecha);
  const minutos = Math.floor((Date.now() - creada.getTime()) / 60000);

  if (minutos < 1) return "Recién";
  if (minutos < 60) return `Hace ${minutos} minuto${minutos === 1 ? "" : "s"}`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} hora${horas === 1 ? "" : "s"}`;

  const dias = Math.floor(horas / 24);
  return `Hace ${dias} día${dias === 1 ? "" : "s"}`;
}

function CardNotificacion({
  notificacion,
  onVerMas,
  onEliminar,
  onAceptarSolicitud,
  onRechazarSolicitud,
  procesando = false,
}) {
  const { tipo, titulo, descripcion, imagen, created_at } = notificacion;
  const esSolicitudAmistad = tipo === "solicitud_amistad";

  return (
    <article className="cardNotificacion">
      <button
        type="button"
        className="cardNotificacionEliminar"
        onClick={() => onEliminar?.(notificacion)}
        aria-label="Eliminar notificación"
      >
        ✕
      </button>

      <span className="cardNotificacionTiempo">
        {formatearTiempo(created_at)}
      </span>

      <h3 className="cardNotificacionTitulo">{titulo}</h3>

      <div className="cardNotificacionContenido">
        {imagen && (
          <img src={imagen} alt="" className="cardNotificacionImagen" />
        )}

        {descripcion && (
          <p className="cardNotificacionDescripcion">{descripcion}</p>
        )}

        {esSolicitudAmistad ? (
          <div className="cardNotificacionAcciones">
            <button
              type="button"
              className="cardNotificacionRechazar"
              onClick={() => onRechazarSolicitud?.(notificacion)}
              disabled={procesando}
            >
              Rechazar
            </button>
            <button
              type="button"
              className="cardNotificacionAceptar"
              onClick={() => onAceptarSolicitud?.(notificacion)}
              disabled={procesando}
            >
              Aceptar
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="cardNotificacionVerMas"
            onClick={() => onVerMas?.(notificacion)}
          >
            Ver más →
          </button>
        )}
      </div>
    </article>
  );
}

export default CardNotificacion;
