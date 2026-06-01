import "./footer.css";

function Footer({}) {
  return (
    <section className="footer">
      <button className="footerButton">
      <img src={homeIcon} alt="Inicio" />
      <span>Inicio</span>
      </button>
      <button className="footerButton">
      <img src={homeIcon} alt="Eventos" />
      <span>Eventos</span>
    </button>
      <button className="footerButton">
      <img src={homeIcon} alt="Perfil" />
      <span>Perfil</span>
    </button>
    </section>
  );
}

export default FiltroSubEvento;
