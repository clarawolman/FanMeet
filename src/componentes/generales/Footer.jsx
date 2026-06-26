import "./Footer.css";

import inicioIcon from "../../assets/InicioMarcado.png";
import eventosIcon from "../../assets/eventosNoMarc.png";
import perfilIcon from "../../assets/PerfilNo.png";

function Footer({ onNavegar }) {
  return (
    <section className="footer">
      <button className="footerButton" onClick={() => onNavegar("home")}>
        <img src={inicioIcon} alt="Inicio" />
        <span>Inicio</span>
      </button>

      <button className="footerButton" onClick={() => onNavegar("misEventos")}>
        <img src={eventosIcon} alt="Mis Eventos" />
        <span>Eventos</span>
      </button>

      <button className="footerButton" onClick={() => onNavegar("perfil")}>
        <img src={perfilIcon} alt="Perfil" />
        <span>Perfil</span>
      </button>
    </section>
  );
}

export default Footer;