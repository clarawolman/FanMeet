import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./estilos.css";
import App from "./App";

// El tema se aplica antes de pintar para que no parpadee al entrar.
try {
  document.documentElement.dataset.theme = localStorage.getItem("fm-theme") === "dark" ? "dark" : "light";
} catch {
  document.documentElement.dataset.theme = "light";
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
