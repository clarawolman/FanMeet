import { createContext, useEffect, useState } from "react";
import { cambiarTamanoTexto } from "../utils/escalaPantalla";

// Preferencias de cómo se ve la app (Configuración → Apariencia). Son de
// este dispositivo: se guardan en el navegador, no en la cuenta.
// eslint-disable-next-line react-refresh/only-export-components
export const TemaContext = createContext(null);

const CLAVE_TEMA = "fm-theme"; // "light" | "dark" | "system"
const CLAVE_ANIMACIONES = "fm-reducir-animaciones";
const CLAVE_TEXTO = "fm-texto"; // "normal" | "grande" | "enorme"

function leer(clave, porDefecto) {
  try {
    return localStorage.getItem(clave) ?? porDefecto;
  } catch {
    return porDefecto;
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // modo privado o almacenamiento bloqueado: queda solo por esta vez
  }
}

const sistemaOscuro = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

export function TemaProvider({ children }) {
  const [modoTema, setModoTema] = useState(() => leer(CLAVE_TEMA, "light"));
  const [oscuroDelSistema, setOscuroDelSistema] = useState(sistemaOscuro);
  const [reducirAnimaciones, setReducirAnimaciones] = useState(() => leer(CLAVE_ANIMACIONES, "no") === "si");
  const [tamanoTexto, setTamanoTexto] = useState(() => leer(CLAVE_TEXTO, "normal"));

  const temaOscuro = modoTema === "dark" || (modoTema === "system" && oscuroDelSistema);

  // Con "Según el dispositivo" sigue los cambios del sistema en vivo
  useEffect(() => {
    if (modoTema !== "system") return undefined;
    const consulta = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!consulta) return undefined;
    const alCambiar = (e) => setOscuroDelSistema(e.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, [modoTema]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", temaOscuro ? "dark" : "light");
  }, [temaOscuro]);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-reducir-animaciones", reducirAnimaciones);
  }, [reducirAnimaciones]);

  function elegirTema(modo) {
    setModoTema(modo);
    setOscuroDelSistema(sistemaOscuro());
    guardar(CLAVE_TEMA, modo);
  }

  function alternarTema() {
    elegirTema(temaOscuro ? "light" : "dark");
  }

  function elegirReducirAnimaciones(valor) {
    setReducirAnimaciones(valor);
    guardar(CLAVE_ANIMACIONES, valor ? "si" : "no");
  }

  function elegirTamanoTexto(tamano) {
    setTamanoTexto(tamano);
    guardar(CLAVE_TEXTO, tamano);
    cambiarTamanoTexto(tamano);
  }

  return (
    <TemaContext.Provider
      value={{
        temaOscuro,
        alternarTema,
        modoTema,
        elegirTema,
        reducirAnimaciones,
        elegirReducirAnimaciones,
        tamanoTexto,
        elegirTamanoTexto,
      }}
    >
      {children}
    </TemaContext.Provider>
  );
}
