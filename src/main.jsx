import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { UsuarioProvider } from "./context/UsuarioContext";
import "./index.css";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UsuarioProvider>
      <App />
    </UsuarioProvider>
  </React.StrictMode>
);
