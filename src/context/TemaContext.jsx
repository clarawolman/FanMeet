import { createContext, useEffect, useState } from "react";

// Contexto del tema claro/oscuro. Lo usa el panel de Configuración del menú
// lateral (MenuConfiguracion) sin tener que pasar props por cada pantalla.
// eslint-disable-next-line react-refresh/only-export-components
export const TemaContext = createContext(null);

export function TemaProvider({ children }) {
  const [temaOscuro, setTemaOscuro] = useState(
    () => localStorage.getItem("fm-theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", temaOscuro ? "dark" : "light");
    localStorage.setItem("fm-theme", temaOscuro ? "dark" : "light");
  }, [temaOscuro]);

  function alternarTema() {
    setTemaOscuro((anterior) => !anterior);
  }

  return (
    <TemaContext.Provider value={{ temaOscuro, alternarTema }}>
      {children}
    </TemaContext.Provider>
  );
}
