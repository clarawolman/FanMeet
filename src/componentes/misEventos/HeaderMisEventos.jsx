import "./HeaderMisEventos.css";

function HeaderMisEventos({ onIrMisGrupos }) {
  return (
    <>
      <header className="headerMisEventos">
        <button className="headerBoton">☰</button>

        <h1 className="logoFanMeet">FanMeet</h1>

        <button className="headerBoton">🔔</button>
      </header>

      <section className="barraTituloEventos">
        <h2>Tus eventos</h2>

        <button
          className="btnMisGrupos"
          onClick={onIrMisGrupos}
        >
          Mis grupos →
        </button>
      </section>
    </>
  );
}

export default HeaderMisEventos;