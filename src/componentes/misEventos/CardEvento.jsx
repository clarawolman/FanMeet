import "./CardEvento.css";

function CardEvento({ evento, onIngresar, onSalir }) {
  const imagen =
    evento.imagen ||
    evento.imagenConcierto ||
    evento.foto ||
    "https://placehold.co/900x500?text=Concierto";

  const artista =
    evento.artista?.nombre ||
    evento.nombre ||
    "Artista";

  const estadio =
    evento.estadio?.nombre ||
    "Estadio";

  const fecha = evento.fecha
    ? new Date(evento.fecha).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <article className="cardEvento">
      <div className="cardEventoImagenContainer">
        <img
          src={imagen}
          alt={artista}
          className="cardEventoImagen"
        />

        <button
          className="btnIngresarEvento"
          onClick={() => onIngresar(evento)}
        >
          Ingresar
        </button>
      </div>

      <div className="cardEventoInfo">

        <h2>{artista}</h2>

        <div className="infoEvento">

          <div className="filaInfo">
            <span className="icono">📍</span>
            <span>{estadio}</span>
          </div>

          <div className="filaInfo">
            <span className="icono">📅</span>
            <span>{fecha}</span>
          </div>

        </div>

        {onSalir && (
          <button
            className="btnSalirEvento"
            type="button"
            onClick={() => onSalir(evento)}
          >
            Salir del concierto
          </button>
        )}

      </div>
    </article>
  );
}

export default CardEvento;