import "./CardEstadio.css";

function CardEstadio({ estadio }) {

  return (
    <section className="EstadioCard">
      <img
        className="EstadioImagen"
        src={imagenEstadio}
        alt={estadio?.nombre || "Estadio"}
      />

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