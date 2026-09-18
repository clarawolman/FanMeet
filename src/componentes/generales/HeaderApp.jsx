import "./HeaderApp.css";

export default function HeaderApp({ onVolver, titulo, subtitulo, acciones }) {
  const filaTitulo = Boolean(onVolver) && Boolean(titulo);
  const filaTituloSola = !onVolver && Boolean(titulo);

  return (
    <header className="headerApp">
      <div className="headerAppFila">
        {onVolver ? (
          <button
            className="headerAppVolver"
            type="button"
            onClick={onVolver}
            aria-label="Volver"
          >
            ←
          </button>
        ) : (
          <p className="headerAppLogo">FanMeet</p>
        )}

        {filaTitulo && (
          <div className="headerAppTitulos">
            <h1 className="headerAppTitulo">{titulo}</h1>
            {subtitulo && <p className="headerAppSubtitulo">{subtitulo}</p>}
          </div>
        )}

        {acciones && !filaTituloSola && (
          <div className="headerAppAcciones">{acciones}</div>
        )}
      </div>

      {filaTituloSola && (
        <div className="headerAppFilaTitulo">
          <div className="headerAppTitulos">
            <h1 className="headerAppTitulo">{titulo}</h1>
            {subtitulo && <p className="headerAppSubtitulo">{subtitulo}</p>}
          </div>

          {acciones && <div className="headerAppAcciones">{acciones}</div>}
        </div>
      )}
    </header>
  );
}
