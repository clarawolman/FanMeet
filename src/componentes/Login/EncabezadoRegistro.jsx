import Marca from "../generales/Marca";
import "./RegistroComun.css";

const TOTAL_PASOS = 3;

// Encabezado compartido por los tres pasos del registro: volver, marca y
// progreso. Cada paso solo dice en cuál está; sin paso (verificación de
// mail) queda solo volver y marca. Con `onOmitir` el paso es opcional y se
// muestra "Omitir" para saltearlo.
function EncabezadoRegistro({ paso, onVolver, onOmitir }) {
  return (
    <header className="regHeader">
      <div className="regHeaderFila">
        <button className="regVolver" type="button" onClick={onVolver} aria-label="Volver">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <Marca className="regMarca" />

        {paso && (
          <span className="regPaso">
            Paso {paso} de {TOTAL_PASOS}
          </span>
        )}

        {onOmitir && (
          <button className="regOmitir" type="button" onClick={onOmitir}>
            Omitir
          </button>
        )}
      </div>

      {paso && (
        <div
          className="regBarra"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_PASOS}
          aria-valuenow={paso}
          aria-label={`Paso ${paso} de ${TOTAL_PASOS}`}
        >
          {Array.from({ length: TOTAL_PASOS }, (_, i) => (
            <span key={i} className={i < paso ? "activo" : ""} />
          ))}
        </div>
      )}
    </header>
  );
}

export default EncabezadoRegistro;
