import "./HeaderHome.css";

function HeaderHome({ usuarioActual }) {
  return (
    <header className="home-header">
      <div>
        <p className="home-eyebrow">FanMeet</p>
        <h1>Encontrá tu próximo show</h1>
      </div>

      <div className="home-usuario">
        <img
          src={
            usuarioActual?.fotoperfil ||
            usuarioActual?.foto_perfil ||
            "https://i.pinimg.com/originals/31/ec/2c/31ec2ce212492e600b8de27f38846ed7.jpg"
          }
          alt={usuarioActual?.nombre || "Usuario"}
        />
      </div>
    </header>
  );
}

export default HeaderHome;