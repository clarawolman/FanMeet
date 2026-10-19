import "./participantesGrupo.css";

// Quién organiza y quiénes van. Tocarlo abre la lista de fans confirmados.
export default function ParticipantesGrupo({ participantes = [], idCreador, onVerFansConfirmados }) {
  const creador = participantes.find((u) => u.id_usuario === idCreador);
  const cantidad = participantes.length;

  return (
    <button className="participantesGrupo" type="button" onClick={onVerFansConfirmados}>
      <span className="imagenesParticipantes" aria-hidden="true">
        {participantes.slice(0, 5).map((user) => (
          <img key={user.id_usuario} src={user.foto_perfil} alt="" className="fotoParticipante" />
        ))}
      </span>

      <span className="participantesGrupoTexto">
        <strong>
          {cantidad === 0 ? "Todavía no va nadie" : `${cantidad} ${cantidad === 1 ? "fan va" : "fans van"}`}
        </strong>
        {creador && <small>Organiza {creador.apodo || creador.nombre}</small>}
      </span>

      <svg className="participantesGrupoFlecha" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}
