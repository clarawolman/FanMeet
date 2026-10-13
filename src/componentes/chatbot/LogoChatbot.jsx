import logoFani from "../../assets/fani.png";

// Logo de Fani, la asistente de IA. Para cambiarlo alcanza con reemplazar
// src/assets/fani.png (PNG con fondo transparente).
function LogoChatbot({ className, titulo = "Fani" }) {
  return <img className={className} src={logoFani} alt={titulo} draggable={false} />;
}

export default LogoChatbot;
