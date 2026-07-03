import "./HeaderMisGrupos.css";

function HeaderMisGrupos({ onVolver }) {
  return (
    <>
      <header className="home-header">
        <div className="home-header-icons">
          <p className="home-eyebrow">FanMeet</p>
        </div>
      </header>

      <section className="barraTituloGrupos">
        <h2>Tus grupos</h2>

        <button
          className="btnMisEventos"
          onClick={onVolver}
        >
          ← Mis eventos
        </button>
      </section>
    </>
  );
}

export default HeaderMisGrupos;