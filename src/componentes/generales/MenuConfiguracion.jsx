import { useState } from "react";
import "./MenuConfiguracion.css";

function IconoEngranaje() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.6v2M10 15.4v2M17.4 10h-2M4.6 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3 4.9 4.9" />
    </svg>
  );
}

function MenuConfiguracion({ temaOscuro, onCambiarTema }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        className="menuConfigTrigger"
        onClick={() => setAbierto(true)}
        aria-label="Abrir configuración"
      >
        <IconoEngranaje />
      </button>

      <div className={`menuConfigOverlay ${abierto ? "abierto" : ""}`} onClick={() => setAbierto(false)}>
        <aside
          className={`menuConfigPanel ${abierto ? "abierto" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="menuConfigHeader">
            <h2>Configuración</h2>
            <button
              type="button"
              className="menuConfigCerrar"
              onClick={() => setAbierto(false)}
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
              onClick={onCambiarTema}
            >
              <span className="themeSwitchThumb" />
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

export default MenuConfiguracion;
