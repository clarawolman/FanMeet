import "./confirmacionGrupo.css";

export default function ConfirmacionGrupo({
  onConfirmar,
  cargandoConfirmacion,
}) {
  return (
    <div className="confirmacionGrupo">
      <h3>¡Sumate al grupo!</h3>

      <p>
        Confirmá tu asistencia para recibir notificaciones y enterarte de todas
        las novedades del evento.
      </p>

      <button onClick={onConfirmar} disabled={cargandoConfirmacion}>
        {cargandoConfirmacion ? "Confirmando..." : "Confirmar asistencia"}
      </button>
    </div>
  );
}