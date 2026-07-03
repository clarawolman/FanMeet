import "./HeaderMisEventos.css";

function HeaderMisEventos({ onIrMisGrupos }) {
  return (
    <>
    <header className="home-header">
      <div className="home-header-icons">
        <p className="home-eyebrow">FanMeet</p>
      </div>

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