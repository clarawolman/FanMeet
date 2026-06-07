import "./headerGrupo.css";
export default function HeaderGrupo({ titulo, onVolver }) {
  return (
    <div className="headerGrupo">
      <button className="backButton" onClick={onVolver}>
        ←
      </button>

      <h2>{titulo}</h2>
    </div>
  );
}

