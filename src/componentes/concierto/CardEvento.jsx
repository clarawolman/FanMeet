import "./CardEvento.css";
import { cuentaRegresiva } from "../../utils/fechas";

// Hero del concierto: la foto a sangre, cuánto falta arriba y el artista
// + nombre del show abajo. Fecha, hora y lugar van en la tira de abajo.
function CardEvento({ concierto }) {
  const falta = cuentaRegresiva(concierto.fecha);
  const artista = concierto.artista?.nombre;
  const titulo = concierto.nombre || artista;

  return (
    <section className="CardEvento">
      <img className="EventoImagen" src={concierto.imagen} alt="" />
      <div className="EventoOverlay" />

      {falta && (
        <span className={`EventoFalta ${falta === "Hoy" ? "EventoFalta--hoy" : ""}`}>
          {falta === "Hoy" && <span className="EventoFaltaPunto" aria-hidden="true" />}
          {falta}
        </span>
      )}

      <div className="EventoContenido">
        {artista && artista !== titulo && <p className="EventoArtista">{artista}</p>}
        <h2 className="EventoTitulo">{titulo}</h2>
      </div>
    </section>
  );
}

export default CardEvento;
