import "./CardEvento.css";

function CardEvento({concierto}) {
  return (
    <section className="CardEvento">
      <img className="EventoImagen"
        src={concierto.imagenConcierto}
        alt={concierto.nombre}
      />

      <div className="EventoOverlay"></div>

      <div className="EventoContenido">
        <p className="EventoArtista"> {concierto.artista.nombre} </p>
        <h2 className="EventoTitulo">{concierto.nombre} </h2>
        <p className="EventoFecha"> {concierto.fecha} </p>
        <p className="EventoUbicacion"> {concierto.estadio.nombre}, {concierto.estadio.ciudad} </p>
      </div>
    </section>
  );
}

export default CardEvento;