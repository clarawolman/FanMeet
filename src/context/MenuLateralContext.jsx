import { createContext, useState } from "react";

// Menú hamburguesa lateral (solo mobile). Lo abre el botón ☰ del header de
// cualquier pantalla y se dibuja una sola vez en App (MenuLateral).
// eslint-disable-next-line react-refresh/only-export-components
export const MenuLateralContext = createContext(null);

export function MenuLateralProvider({ children }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <MenuLateralContext.Provider
      value={{
        abierto,
        abrirMenu: () => setAbierto(true),
        cerrarMenu: () => setAbierto(false),
      }}
    >
      {children}
    </MenuLateralContext.Provider>
  );
}
