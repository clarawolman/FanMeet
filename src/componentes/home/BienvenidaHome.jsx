import "./BienvenidaHome.css";

function BienvenidaHome({ usuarioActual }) {
  return (
    <section className="home-bienvenida">
      <p>Hola, {usuarioActual?.nombre || "fan"}.</p>
      <h2>Más que un show, una conexión.</h2>
      <span>
        Explorá recitales, ingresá con tu código y conectá con personas que van
        al mismo evento.
      </span>
    </section>
  );
}

export default BienvenidaHome;