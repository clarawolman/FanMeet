import { useContext, useEffect } from "react";
import "./MenuConfiguracion.css";
import "./MenuLateral.css";
import { MenuLateralContext } from "../../context/MenuLateralContext";
import { TemaContext } from "../../context/TemaContext";
import {
  IconoNavDescubrir,
  IconoNavGrupos,
  IconoNavNotificaciones,
  IconoNavSalir,
} from "./iconosNav";

// En mobile la barra de abajo solo tiene Inicio, Eventos, Chats y Perfil;
// el resto de la navegación vive en este menú lateral.
const ITEMS = [
  { destino: "descubrir", texto: "Descubrir fans", Icono: IconoNavDescubrir },
  { destino: "misGrupos", texto: "Mis grupos", Icono: IconoNavGrupos },
  { destino: "notificaciones", texto: "Notificaciones", Icono: IconoNavNotificaciones },
];

export default function MenuLateral({ pantallaActiva, onNavegar, onCerrarSesion }) {
  const { abierto, cerrarMenu } = useContext(MenuLateralContext);
  const { temaOscuro, alternarTema } = useContext(TemaContext);

  useEffect(() => {
    if (!abierto) return;
    function alApretarTecla(e) {
      if (e.key === "Escape") cerrarMenu();
    }
    window.addEventListener("keydown", alApretarTecla);
    return () => window.removeEventListener("keydown", alApretarTecla);
  }, [abierto, cerrarMenu]);

  function navegar(destino) {
    cerrarMenu();
    if (destino !== pantallaActiva) onNavegar(destino);
  }

  // Cerrado, nada del panel tiene que recibir foco con Tab.
  const foco = abierto ? 0 : -1;

  return (
    <div
      className={`menuLateralOverlay ${abierto ? "abierto" : ""}`}
      onClick={cerrarMenu}
      aria-hidden={!abierto}
    >
      <aside
        className={`menuLateralPanel ${abierto ? "abierto" : ""}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="Menú"
      >
        <div className="menuLateralHeader">
          <p className="menuLateralLogo">FanMeet</p>
          <button
            type="button"
            className="menuLateralCerrar"
            onClick={cerrarMenu}
            aria-label="Cerrar menú"
            tabIndex={foco}
          >
            ×
          </button>
        </div>

        <nav className="menuLateralItems">
          {ITEMS.map(({ destino, texto, Icono }) => (
            <button
              key={destino}
              type="button"
              className={`menuLateralItem ${pantallaActiva === destino ? "activo" : ""}`}
              onClick={() => navegar(destino)}
              tabIndex={foco}
            >
              <Icono className="menuLateralIcono" />
              {texto}
            </button>
          ))}
        </nav>

        <div className="menuLateralTema">
          <div className="menuLateralTemaTexto">
            <strong>Modo oscuro</strong>
            <span>{temaOscuro ? "Activado" : "Desactivado"}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={temaOscuro}
            aria-label="Modo oscuro"
            className={`themeSwitch ${temaOscuro ? "on" : ""}`}
            onClick={alternarTema}
            tabIndex={foco}
          >
            <span className="themeSwitchThumb" />
          </button>
        </div>

        <button
          type="button"
          className="menuLateralItem menuLateralSalir"
          onClick={() => {
            cerrarMenu();
            onCerrarSesion();
          }}
          tabIndex={foco}
        >
          <IconoNavSalir className="menuLateralIcono" />
          Cerrar sesión
        </button>
      </aside>
    </div>
  );
}
