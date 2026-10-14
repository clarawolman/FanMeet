import { useEffect, useState } from "react";
import { IconoCerrar } from "./iconosNav";

const DURACION_MS = 4500;

function Avisos() {
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    let temporizador;

    function manejarAviso(evento) {
      clearTimeout(temporizador);
      setAviso({ ...evento.detail, id: Date.now() });
      temporizador = setTimeout(() => setAviso(null), DURACION_MS);
    }

    window.addEventListener("fm-aviso", manejarAviso);
    return () => {
      window.removeEventListener("fm-aviso", manejarAviso);
      clearTimeout(temporizador);
    };
  }, []);

  return (
    <div className="fmAvisos" role="status" aria-live="polite">
      {aviso && (
        <div key={aviso.id} className={`fmAviso fmAviso-${aviso.tipo}`}>
          <span>{aviso.texto}</span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setAviso(null)}>
            <IconoCerrar />
          </button>
        </div>
      )}
    </div>
  );
}

export default Avisos;
