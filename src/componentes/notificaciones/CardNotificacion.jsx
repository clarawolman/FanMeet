import "./CardNotificacion.css";
import { IconoCerrar, IconoNavChat, IconoNavGrupos } from "../generales/iconosNav";
import { IconoCalendario } from "../generales/iconosTarjeta";
import { IconoCarrusel, IconoComentario, IconoCorazon } from "../momento/iconosMomento";
import { haceCuanto } from "../../utils/fechas";

// Insignia sobre la foto: de un vistazo se sabe de qué es cada aviso.
function IconoAmistad(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 20c.6-3.6 3.2-6 6.5-6 1.4 0 2.6.4 3.6 1.1M18 14v6M15 17h6" />
    </svg>
  );
}

const INSIGNIAS = {
  solicitud_amistad: { Icono: IconoAmistad, tono: "accent" },
  amistad_aceptada: { Icono: IconoAmistad, tono: "exito" },
  momento_etiquetado: { Icono: IconoCarrusel, tono: "accent" },
  momento_like: { Icono: (p) => <IconoCorazon lleno {...p} />, tono: "accent" },
  momento_comentario: { Icono: IconoComentario, tono: "tinta" },
  concierto_unido: { Icono: IconoCalendario, tono: "tinta" },
  novedad_concierto: { Icono: IconoCalendario, tono: "tinta" },
  recordatorio_concierto: { Icono: IconoCalendario, tono: "accent" },
  grupo_unido: { Icono: IconoNavGrupos, tono: "tinta" },
  cambio_grupo: { Icono: IconoNavGrupos, tono: "tinta" },
  mensaje_grupo: { Icono: IconoNavChat, tono: "tinta" },
  mensaje_privado: { Icono: IconoNavChat, tono: "tinta" },
};

function CardNotificacion({
  notificacion,
  onVerMas,
  onEliminar,
  onAceptarSolicitud,
  onRechazarSolicitud,
  procesando = false,
}) {
  const { tipo, titulo, descripcion, created_at, leida } = notificacion;
  const insignia = INSIGNIAS[tipo];
  // Solicitud de amistad o invitación a sumar un momento: se responden acá.
  const esSolicitudAmistad = tipo === "solicitud_amistad" || tipo === "momento_etiquetado";
  // Algunas notificaciones viejas guardaron la vista previa local de la foto
  // ("blob:..."), que solo existía en el navegador donde se creó.
  const imagen = notificacion.imagen?.startsWith("blob:") ? "" : notificacion.imagen;

  return (
    <article className={`cardNotificacion ${leida ? "" : "cardNotificacion--nueva"}`}>
      <span className="cardNotificacionFoto">
        {imagen ? (
          <img src={imagen} alt="" className="cardNotificacionImagen" />
        ) : (
          <span className="cardNotificacionImagen cardNotificacionImagen--vacia" aria-hidden="true" />
        )}
        {insignia && (
          <span className={`cardNotificacionInsignia cardNotificacionInsignia--${insignia.tono}`} aria-hidden="true">
            <insignia.Icono />
          </span>
        )}
      </span>

      <div className="cardNotificacionContenido">
        <h3 className="cardNotificacionTitulo">{titulo}</h3>

        {descripcion && (
          <p className="cardNotificacionDescripcion">{descripcion}</p>
        )}

        <time className="cardNotificacionTiempo" dateTime={created_at}>
          {haceCuanto(created_at)}
        </time>

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
          // Ocupa toda la fila (::after), así se toca en cualquier parte.
          <button
            type="button"
            className="cardNotificacionVerMas"
            onClick={() => onVerMas?.(notificacion)}
          >
            <span className="fmSoloLectores">Ver más: {titulo}</span>
          </button>
        )}
      </div>

      <button
        type="button"
        className="cardNotificacionEliminar"
        onClick={() => onEliminar?.(notificacion)}
        aria-label="Eliminar notificación"
      >
        <IconoCerrar />
      </button>
    </article>
  );
}

export default CardNotificacion;
