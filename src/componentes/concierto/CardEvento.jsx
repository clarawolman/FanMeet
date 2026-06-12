import "./CardEvento.css";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatearFecha(fecha) {
  if (!fecha) return "";

  const dia = new Date(fecha);

  if (isNaN(dia.getTime())) return fecha;

  return `${[dia.getMonth()]} de ${MESES[dia.getDate()]} de ${dia.getFullYear()}`;
}

function CardEvento({concierto}) {
  return (
    <section className="CardEvento">
      <img className="EventoImagen"
        src={concierto.imagen}
        alt={concierto.nombre}
      />

      <div className="EventoOverlay"></div>

      <div className="EventoContenido">
        <p className="EventoArtista"> {concierto.artista.nombre} </p>
        <h2 className="EventoTitulo">{concierto.nombre} </h2>
        <p className="EventoFecha"> {formatearFecha(concierto.fecha)} </p>
        <p className="EventoUbicacion"> {concierto.estadio.nombre}, {concierto.estadio.ciudad} </p>
      </div>
    </section>
  );
}

export default CardEvento;