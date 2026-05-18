import "./FiltroSubEvento.css";

function FiltroSubEvento({ filtros, filtroActivo, onCambiarFiltro }) {
  return (
    <section className="filtro-sub-evento">
      {filtros.map((filtro) => (
        <button
          key={filtro.id}
          className={
            filtroActivo === filtro.id
              ? "filtro-sub-evento__boton filtro-sub-evento__boton--activo"
              : "filtro-sub-evento__boton"
          }
          onClick={() => onCambiarFiltro(filtro.id)}
        >
          {filtro.nombre}
        </button>
      ))}
    </section>
  );
}

export default FiltroSubEvento;