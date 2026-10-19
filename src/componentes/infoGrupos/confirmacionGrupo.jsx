import "./confirmacionGrupo.css";

// Barra fija abajo con la acción principal del grupo: sumarse o, si ya
// estás, ir al chat. Siempre a mano sin tener que bajar hasta el final.
export default function ConfirmacionGrupo({ confirmado, completo = false, onConfirmar, onAbrirChat, cargandoConfirmacion }) {
  return (
    <div className="confirmacionGrupo" role="region" aria-label="Asistencia">
      <div className="confirmacionGrupoTexto">
        {confirmado ? (
          <>
            <strong>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Vas con este grupo
            </strong>
            <small>Coordiná con los demás en el chat.</small>
          </>
        ) : completo ? (
          <>
            <strong>Grupo completo</strong>
            <small>Ya se ocuparon todos los lugares. Si alguien sale, se libera uno.</small>
          </>
        ) : (
          <>
            <strong>¿Vas con este grupo?</strong>
            <small>Sumate para entrar al chat y enterarte de las novedades.</small>
          </>
        )}
      </div>

      {confirmado ? (
        <button type="button" className="fmBotonPrimario" onClick={onAbrirChat}>
          Ir al chat
        </button>
      ) : completo ? null : (
        <button type="button" className="fmBotonPrimario" onClick={onConfirmar} disabled={cargandoConfirmacion}>
          {cargandoConfirmacion ? "Sumándote…" : "Me sumo"}
        </button>
      )}
    </div>
  );
}
