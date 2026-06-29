import "./Footer.css";

import inicioMarcadoIcon from "../../assets/InicioMarcado.png";
import inicioNoMarcIcon from "../../assets/FooterInicioNo.png";
import eventosMarcadoIcon from "../../assets/eventosMarcado.png";
import eventosNoMarcIcon from "../../assets/eventosNoMarc.png";
import perfilIcon from "../../assets/PerfilNo.png";

function Footer({ onNavegar, pantallaActiva }) {
  function navegar(destino) {
    if (pantallaActiva === destino) return;
    onNavegar(destino);
  }

  return (
    <section className="footer">
      <button className="footerButton" type="button" onClick={() => navegar("home")}>
        <img
          src={pantallaActiva === "home" ? inicioMarcadoIcon : inicioNoMarcIcon}
          alt="Inicio"
        />
        <span>Inicio</span>
      </button>

      <button className="footerButton" type="button" onClick={() => navegar("misEventos")}>
        <img
          src={
            pantallaActiva === "misEventos"
              ? eventosMarcadoIcon
              : eventosNoMarcIcon
          }
          alt="Mis Eventos"
        />
        <span>Eventos</span>
      </button>

      <button className="footerButton" type="button" onClick={() => navegar("perfil")}>
        <img src={perfilIcon} alt="Perfil" />
        <span>Perfil</span>
      </button>
    </section>
  );
}

export default Footer;