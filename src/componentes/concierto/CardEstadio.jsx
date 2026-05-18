import "./CardEstadio.css";

function CardEstadio({estadio}) {
  return (
    <section className="EstadioCard">
      <img className="EstadioImagen"
        src={estadio.imagen}
        alt={estadio.nombre}
      />

      <div className="EstadioContenido">
        <h3 className="EstadioNombre">{estadio.nombre}</h3>
        <p className="EstadioDireccion"> {estadio.direccion} </p>
      </div>
    </section>
  );
}

export default CardEstadio;