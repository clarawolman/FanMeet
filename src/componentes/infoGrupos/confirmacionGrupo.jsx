import "./confirmacionGrupo.css";

export default function ConfirmacionGrupo({
  onConfirmar,
  confirmado,
  cargandoConfirmacion,
}) {
  return (
    <div className="confirmacionGrupo">
      <h3>¡Sumate al grupo!</h3>

      <p>
        Confirmá tu asistencia para recibir notificaciones y enterarte de todas
        las novedades del evento.
      </p>

      <button
        onClick={onConfirmar}
        disabled={confirmado || cargandoConfirmacion}
      >
        {confirmado
          ? "Asistencia confirmada"
          : cargandoConfirmacion
          ? "Confirmando..."
          : "Confirmar asistencia"}
      </button>
    </div>
    )
}