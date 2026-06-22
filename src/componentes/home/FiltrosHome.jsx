import "./FiltrosHome.css";

function FiltrosHome({ filtros, filtroActivo, onCambiarFiltro }) {
  return (
    <section className="home-filtros">
      {filtros.map((filtro) => (
        <button
          key={filtro.id}
          className={
            filtroActivo === filtro.id
              ? "home-filtro home-filtro--activo"
              : "home-filtro"
          }
          onClick={() => onCambiarFiltro(filtro.id)}
        >
          {filtro.nombre}
        </button>
      ))}
    </section>
  );
}

export default FiltrosHome;