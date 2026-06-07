import "./Footer.css";

import inicioIcon from "../../assets/InicioMarcado.png";
import eventosIcon from "../../assets/eventosNoMarc.png";
import perfilIcon from "../../assets/PerfilNo.png";

function Footer() {
  return (
    <section className="footer">
      <button className="footerButton">
        <img src={inicioIcon} alt="Inicio" />
        <span>Inicio</span>
      </button>

      <button className="footerButton">
        <img src={eventosIcon} alt="Eventos" />
        <span>Eventos</span>
      </button>

      <button className="footerButton">
        <img src={perfilIcon} alt="Perfil" />
        <span>Perfil</span>
      </button>
    </section>
  );
}

export default Footer;