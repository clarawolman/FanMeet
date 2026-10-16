import "./LoadingSpinner.css";

// En línea: esqueleto de lista (filas con imagen y dos líneas de texto),
// que se parece a lo que va a aparecer. Pantalla completa: spinner discreto.
function LoadingSpinner({ texto = "Cargando…", tamano = 32, pantallaCompleta = false, filas = 3 }) {
  if (!pantallaCompleta) {
    return (
      <div className="loadingEsqueleto" role="status">
        <span className="fmSoloLectores">{texto}</span>
        {Array.from({ length: filas }, (_, i) => (
          <div className="loadingEsqueletoFila" key={i} aria-hidden="true">
            <div className="fmSkeleton loadingEsqueletoImagen" />
            <div className="loadingEsqueletoTextos">
              <div className="fmSkeleton loadingEsqueletoLinea" />
              <div className="fmSkeleton loadingEsqueletoLinea loadingEsqueletoLinea--corta" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="loadingSpinnerPantalla" role="status">
      <span className="fmSpinner" style={{ width: tamano, height: tamano }} aria-hidden="true" />
      <p>{texto}</p>
    </div>
  );
}

export default LoadingSpinner;
