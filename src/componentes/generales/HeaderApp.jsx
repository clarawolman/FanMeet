import { useContext } from "react";
import "./HeaderApp.css";
import { MenuLateralContext } from "../../context/MenuLateralContext";
import { IconoNavMenu, IconoVolver } from "./iconosNav";
import Marca from "./Marca";

export default function HeaderApp({ onVolver, titulo, subtitulo, acciones }) {
  const { abrirMenu } = useContext(MenuLateralContext);
  const filaTitulo = Boolean(onVolver) && Boolean(titulo);
  const filaTituloSola = !onVolver && Boolean(titulo);

  return (
    <header className="headerApp">
      {/* Con título propio, esta fila solo tiene la marca y el menú: en
          escritorio las dos viven en el sidebar y la fila se oculta. */}
      <div className={`headerAppFila ${filaTituloSola ? "headerAppFila--soloMovil" : ""}`}>
        {onVolver ? (
          <button
            className="headerAppVolver"
            type="button"
            onClick={onVolver}
            aria-label="Volver"
          >
            <IconoVolver />
          </button>
        ) : (
          <Marca className="headerAppLogo" />
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

        {/* Solo mobile: abre el menú lateral con lo que no entra en la barra de abajo */}
        <button
          className="headerAppMenu"
          type="button"
          onClick={abrirMenu}
          aria-label="Abrir menú"
        >
          <IconoNavMenu />
        </button>
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
