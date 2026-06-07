import "./CardEstadio.css";

function CardEstadio({ estadio }) {

  return (
    <section className="EstadioCard">
      <img
        className="EstadioImagen"
        src={estadio?.venueImage || "https://images.unsplash.com/photo-1577223625816-7546f13df25d"}
        alt={estadio?.nombre || "Estadio"}
      />
      {/* no entiendo por que en estadio hay un ? dsp */}
      <div className="EstadioContenido">
        <h3 className="EstadioNombre">
          {estadio?.nombre} 
        </h3>

        <p className="EstadioDireccion">
          {estadio?.direccion}
          {estadio?.ciudad ? `, ${estadio.ciudad}` : ""}
        </p>
      </div>
    </section>
  );
}

export default CardEstadio;