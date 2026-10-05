import { useContext } from "react";
import "./MenuConfiguracion.css";
import { TemaContext } from "../../context/TemaContext";

// Panel de Configuración. Se abre desde el ítem "Configuración" del menú
// lateral (Footer), que controla si está abierto.
function MenuConfiguracion({ abierto, onCerrar }) {
  const { temaOscuro, alternarTema } = useContext(TemaContext);

  return (
    <div className={`menuConfigOverlay ${abierto ? "abierto" : ""}`} onClick={onCerrar}>
      <aside
        className={`menuConfigPanel ${abierto ? "abierto" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="menuConfigHeader">
          <h2>Configuración</h2>
          <button
            type="button"
            className="menuConfigCerrar"
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="menuConfigItem">
          <div className="menuConfigItemTexto">
            <strong>Modo oscuro</strong>
            <span>{temaOscuro ? "Activado" : "Desactivado"}</span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={temaOscuro}
            className={`themeSwitch ${temaOscuro ? "on" : ""}`}
            onClick={alternarTema}
          >
            <span className="themeSwitchThumb" />
          </button>
        </div>
      </aside>
    </div>
  );
}

export default MenuConfiguracion;
