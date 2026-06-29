import "./CardConciertoHome.css";

function CardConciertoHome({ concierto, onAbrir }) {
  return (
    <article className="home-card" onClick={onAbrir}>
      <div className="home-card-imagen">
        <img
          src={
            concierto.imagen ||
            concierto.imagenConcierto ||
            concierto.foto ||
            ""
          }
          alt={concierto.nombre || concierto.artista?.nombre}
        />
      </div>

      <div className="home-card-info">
        <p>{concierto.artista?.nombre || "Artista"}</p>
        <h3>{concierto.nombre || concierto.artista?.nombre}</h3>

        <div className="home-card-meta">
          <span>{concierto.fecha || "Fecha a confirmar"}</span>
          <span>
            {concierto.estadio?.nombre ||
              concierto.estadio?.ciudad ||
              "Estadio"}
          </span>
        </div>
      </div>
    </article>
  );
}

export default CardConciertoHome;