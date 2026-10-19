import { useState } from "react";
import "../generales/ModalConfirmacion.css";
import "./ModalConsejosSeguridad.css";
import { ocultarConsejos } from "../../utils/consejosSeguridad";

const CONSEJOS = [
  { titulo: "Avisale a alguien de confianza", texto: "Contale con quién vas, dónde y a qué hora." },
  { titulo: "Cuidá tus datos personales", texto: "No compartas tu dirección, documentos ni datos bancarios." },
  { titulo: "Si algo no está bien, reportá y bloqueá", texto: "Desde el perfil de la persona." },
];

// Consejos breves antes de confirmar la asistencia a un grupo.
function ModalConsejosSeguridad({ confirmando = false, onConfirmar, onCancelar }) {
  const [noMostrar, setNoMostrar] = useState(false);

  function confirmar() {
    if (noMostrar) ocultarConsejos();
    onConfirmar();
  }

  return (
    <div className="modalConfirmacionFondo" onClick={confirmando ? undefined : onCancelar}>
      <div
        className="modalConfirmacionCaja modalConsejosCaja"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consejos-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="consejos-titulo" className="modalConfirmacionTexto">
          Antes de sumarte
        </p>

        <ul className="modalConsejosLista">
          {CONSEJOS.map((c) => (
            <li key={c.titulo}>
              <strong>{c.titulo}</strong>
              <span>{c.texto}</span>
            </li>
          ))}
        </ul>

        <label className="modalConsejosNoMostrar">
          <input
            type="checkbox"
            checked={noMostrar}
            onChange={(e) => setNoMostrar(e.target.checked)}
          />
          No volver a mostrar
        </label>

        <button
          className="modalConfirmacionBotonSecundario modalConsejosConfirmar"
          type="button"
          onClick={confirmar}
          disabled={confirmando}
        >
          {confirmando ? "Un momento…" : "Entendido, me sumo"}
        </button>
        <button
          className="modalConfirmacionBotonPrincipal modalConsejosCancelar"
          type="button"
          onClick={onCancelar}
          disabled={confirmando}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default ModalConsejosSeguridad;
