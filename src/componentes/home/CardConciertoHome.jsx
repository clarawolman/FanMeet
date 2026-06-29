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
        <button
          className="home-card-btn-unirme"
          onClick={(e) => {
            e.stopPropagation();
            onAbrir();
          }}
        >
          Unirme
        </button>
      </div>

      <div className="home-card-info">
        <h3>{concierto.nombre || concierto.artista?.nombre}</h3>
        <div className="home-card-meta">
          <span>
            {concierto.estadio?.nombre ||
              concierto.estadio?.ciudad ||
              "Estadio"}
          </span>
          <span>{concierto.fecha || "Fecha a confirmar"}</span>
        </div>
      </div>
    </article>
  );
}


export default CardConciertoHome;