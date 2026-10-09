import "./AnilloCompatibilidad.css";

// Porcentaje de compatibilidad dentro de un anillo que se llena.
export default function AnilloCompatibilidad({ porcentaje, tamano = 56 }) {
  const radio = 15.5;
  const circunferencia = 2 * Math.PI * radio;
  const lleno = (Math.max(0, Math.min(100, porcentaje)) / 100) * circunferencia;

  return (
    <span
      className="anilloCompatibilidad"
      style={{ width: tamano, height: tamano, fontSize: tamano * 0.27 }}
      role="img"
      aria-label={`${porcentaje}% compatibles`}
    >
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle className="anilloCompatibilidadFondo" cx="18" cy="18" r={radio} />
        <circle
          className="anilloCompatibilidadValor"
          cx="18"
          cy="18"
          r={radio}
          strokeDasharray={`${lleno} ${circunferencia}`}
        />
      </svg>
      <strong>{porcentaje}%</strong>
    </span>
  );
}
