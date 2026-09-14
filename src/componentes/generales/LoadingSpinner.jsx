import "./LoadingSpinner.css";

function LoadingSpinner({ texto, tamano = 40, pantallaCompleta = false }) {
  const spinner = (
    <span
      className="fmSpinner loadingSpinner"
      style={{ width: tamano, height: tamano }}
      aria-hidden="true"
    />
  );

  if (!pantallaCompleta) {
    return (
      <div className="loadingSpinnerInline">
        {spinner}
        {texto && <p>{texto}</p>}
      </div>
    );
  }

  return (
    <div className="loadingSpinnerPantalla">
      {spinner}
      {texto && <p>{texto}</p>}
    </div>
  );
}

export default LoadingSpinner;
