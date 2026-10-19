import "./Buscador.css";
import { IconoBuscar } from "./iconosNav";

// Campo de búsqueda en pastilla: el de la Home (conciertos) y el de
// Descubrir (perfiles).
export default function Buscador({ valor, onCambiar, placeholder, etiqueta, className = "" }) {
  return (
    <label className={`fmBuscador ${className}`}>
      <IconoBuscar className="fmBuscadorIcono" />

      <input
        type="search"
        aria-label={etiqueta}
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
      />
    </label>
  );
}
