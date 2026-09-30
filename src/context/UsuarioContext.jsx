import { createContext, useState } from "react";

// Contexto del usuario logueado. Evita pasar usuarioActual por props a
// todas las pantallas: cada componente lo lee con useContext(UsuarioContext).
// eslint-disable-next-line react-refresh/only-export-components
export const UsuarioContext = createContext(null);

export function UsuarioProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);

  return (
    <UsuarioContext.Provider value={{ usuarioActual, setUsuarioActual }}>
      {children}
    </UsuarioContext.Provider>
  );
}
