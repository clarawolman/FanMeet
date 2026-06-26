import "./OverlayCodigo.css";

function OverlayCodigo({
  conciertoSeleccionado,
  codigoIngresado,
  errorCodigo,
  onCambiarCodigo,
  onCerrar,
  onValidar,
}) {
  return (
    <div className="home-overlay">
      <div className="home-modal">
        <button className="home-modal-cerrar" onClick={onCerrar}>
          ×
        </button>

        <p className="home-modal-eyebrow">Acceso al evento</p>
        <h2>{conciertoSeleccionado.nombre}</h2>
        <span>
          Ingresá el código que recibiste con tu entrada para desbloquear la
          comunidad del concierto.
        </span>

        <input
          type="text"
          value={codigoIngresado}
          onChange={(e) => onCambiarCodigo(e.target.value)}
          placeholder="Código de acceso"
        />

        {errorCodigo && <p className="home-error">{errorCodigo}</p>}

        <button className="home-btn-principal" onClick={onValidar}>
          Entrar al concierto
        </button>
      </div>
    </div>
  );
}

export default OverlayCodigo;