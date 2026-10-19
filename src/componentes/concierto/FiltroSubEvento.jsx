import "./FiltroSubEvento.css";

// Control segmentado: Todos / Pre / After / Hoy, con cuántos grupos hay en cada uno.
function FiltroSubEvento({ filtros, filtroActivo, onCambiarFiltro, cantidades = {}, etiqueta = "Filtrar grupos" }) {
  return (
    <div className="filtro-sub-evento" role="tablist" aria-label={etiqueta}>
      {filtros.map((filtro) => {
        const activo = filtroActivo === filtro.id;
        const cantidad = cantidades[filtro.id];
        return (
          <button
            type="button"
            role="tab"
            aria-selected={activo}
            key={filtro.id}
            className={`filtro-sub-evento__boton ${activo ? "filtro-sub-evento__boton--activo" : ""}`}
            onClick={() => onCambiarFiltro(filtro.id)}
          >
            {filtro.nombre}
            {cantidad !== undefined && <span className="filtro-sub-evento__cantidad">{cantidad}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default FiltroSubEvento;
