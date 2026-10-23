import "./OverlayCodigo.css";
import "./SelectorFechas.css";
import { IconoCerrar, IconoSiguiente } from "../generales/iconosNav";
import { formatearFechaLarga } from "../../utils/fechas";

// Se abre al tocar una carpeta de la home (un artista varios días seguidos
// en el mismo estadio): se elige la fecha y sigue el flujo de siempre.
function SelectorFechas({ fechas, estaUnido, onElegir, onCerrar }) {
  const primera = fechas[0];
  const titulo = primera.artista?.nombre || primera.nombre;

  return (
    <div className="home-overlay" onClick={onCerrar}>
      <div className="home-modal" role="dialog" aria-modal="true" aria-label={`Fechas de ${titulo}`} onClick={(e) => e.stopPropagation()}>
        <button className="home-modal-cerrar" type="button" onClick={onCerrar} aria-label="Cerrar">
          <IconoCerrar />
        </button>

        <p className="home-modal-eyebrow">{fechas.length} fechas</p>
        <h2>{titulo}</h2>
        <span>{primera.estadio?.nombre || "Estadio a confirmar"} · Elegí a qué fecha vas.</span>

        <ul className="selectorFechas-lista">
          {fechas.map((concierto) => {
            const fans = concierto.cantidadFans ?? 0;
            const grupos = concierto.cantidadGrupos ?? 0;
            const hora = String(concierto.fecha || "").slice(11, 16);
            return (
              <li key={concierto.id_concierto}>
                <button type="button" className="selectorFechas-fecha" onClick={() => onElegir(concierto)}>
                  <span className="selectorFechas-texto">
                    <strong>
                      {formatearFechaLarga(concierto.fecha)}
                      {hora && ` · ${hora}`}
                    </strong>
                    <small>
                      {fans} {fans === 1 ? "fan" : "fans"} · {grupos} {grupos === 1 ? "grupo" : "grupos"}
                    </small>
                  </span>
                  {estaUnido(concierto.id_concierto) && <span className="selectorFechas-unido">Te uniste</span>}
                  <IconoSiguiente />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default SelectorFechas;
