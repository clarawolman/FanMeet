import "./HeaderHome.css";

function HeaderHome({ usuarioActual }) {
  return (
    <header className="home-header">
      <div className="home-header-icons">
        <button className="home-header-hamburger" aria-label="Menú">
          <span />
          <span />
          <span />
        </button>
        <p className="home-eyebrow">FanMeet</p>
      </div>
      <button className="home-header-bell" aria-label="Notificaciones">
        🔔
      </button>
    </header>
  );
}

export default HeaderHome;