import "./HeaderCrearGrupo.css";

function HeaderCrearGrupo({ onVolver }) {
  return (
    <header className="crearGrupoHeader">
      <button className="crearGrupoVolver" onClick={onVolver} aria-label="Volver">
        <svg
          width="25"
          height="25"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.5 5L8.5 12L15.5 19"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div>
        <p className="crearGrupoHeaderEyebrow">FanMeet</p>
        <p className="crearGrupoHeaderTexto">Crear sub-evento</p>
      </div>
    </header>
  );
}

export default HeaderCrearGrupo;