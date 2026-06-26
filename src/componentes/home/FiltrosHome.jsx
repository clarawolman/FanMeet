import "./FiltrosHome.css";

function FiltrosHome({ filtros, filtroActivo, onCambiarFiltro }) {
  return (
    <section className="home-filtros">
      {filtros.map((filtro) => (
        <button          
          type="button"
          key={filtro.id}
          className={
            filtroActivo === filtro.id
              ? "home-filtro home-filtro--activo"
              : "home-filtro"
          }
          onClick={() => {
            console.log("TOQUÉ FILTRO:", filtro.id);
            onCambiarFiltro(filtro.id);
          }}        
          >
          {filtro.nombre}
        </button>
      ))}
    </section>
  );
}

export default FiltrosHome;