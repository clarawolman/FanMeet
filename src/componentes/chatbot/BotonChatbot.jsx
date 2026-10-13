import "./BotonChatbot.css";
import LogoChatbot from "./LogoChatbot";

// Botón flotante abajo a la derecha del Inicio: abre el chat con Fani.
function BotonChatbot({ onAbrir }) {
  return (
    <button type="button" className="botonChatbot" onClick={onAbrir} aria-label="Chatear con Fani">
      <LogoChatbot className="botonChatbotLogo" />
      <span className="botonChatbotTexto">¿Necesitás ayuda?</span>
    </button>
  );
}

export default BotonChatbot;
