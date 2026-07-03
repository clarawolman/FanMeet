import "./CardConciertoHome.css";

function CardConciertoHome({ concierto, onAbrir }) {
  return (
    <article className="card-concierto-home" onClick={onAbrir}>
      <div className="card-concierto-home-imagen">
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
          className="card-concierto-home-btn-unirme"
          onClick={(e) => {
            e.stopPropagation();
            onAbrir();
          }}
        >
          Unirme
        </button>
      </div>

      <div className="card-concierto-home-info">
        <h3>{concierto.nombre || concierto.artista?.nombre}</h3>
        <div className="card-concierto-home-meta">
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