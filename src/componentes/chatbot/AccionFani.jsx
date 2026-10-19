import "./AccionFani.css";

// Propuesta de Fani dentro de su mensaje: sumarse a un grupo. Fani no hace
// nada sola; el backend suma al usuario recién cuando toca Confirmar.
function AccionFani({ idMensaje, accion, resolviendo, onResolver }) {
  if (accion?.tipo !== "unirse_grupo") return null;

  return (
    <div className="accionFani">
      <span className="accionFaniTitulo">Sumarte a {accion.grupo}</span>
      {accion.concierto && <span className="accionFaniDetalle">{accion.concierto}</span>}

      {accion.estado === "pendiente" && (
        <div className="accionFaniBotones">
          <button
            type="button"
            className="accionFaniConfirmar"
            onClick={() => onResolver(idMensaje, "confirmar")}
            disabled={resolviendo}
          >
            {resolviendo ? "Un momento…" : "Confirmar"}
          </button>
          <button
            type="button"
            className="accionFaniCancelar"
            onClick={() => onResolver(idMensaje, "cancelar")}
            disabled={resolviendo}
          >
            Cancelar
          </button>
        </div>
      )}
      {accion.estado === "hecha" && <span className="accionFaniEstado accionFaniEstado--hecha">Te sumaste ✓</span>}
      {accion.estado === "cancelada" && <span className="accionFaniEstado">Cancelado</span>}
    </div>
  );
}

export default AccionFani;
