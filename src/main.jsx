import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { UsuarioProvider } from "./context/UsuarioContext";
import { TemaProvider } from "./context/TemaContext";
import { MenuLateralProvider } from "./context/MenuLateralContext";
import "./index.css";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TemaProvider>
      <UsuarioProvider>
        <MenuLateralProvider>
          <App />
        </MenuLateralProvider>
      </UsuarioProvider>
    </TemaProvider>
  </React.StrictMode>
);
