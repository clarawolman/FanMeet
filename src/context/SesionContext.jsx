import { createContext } from "react";

// Función para cerrar sesión. La provee App (que limpia su estado) y la usa
// el botón "Cerrar sesión" del sidebar de escritorio (Footer), que se dibuja
// desde cada pantalla sin pasarle props.
export const SesionContext = createContext(null);
