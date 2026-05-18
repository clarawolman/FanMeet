import "./FansUnidos.css";

function FansUnidos({ fans }) {
  return (
    <section className="FansUnidosCard">
      <p className="FansSubtitulo"> Fans unidos </p>
      <h2 className="FansCantidad"> {fans.length} </h2>
      <button className="FansTexto"> Conocelos</button> {/* falta link a la pagina de usuarios unidos */}
      <div className="FansBarra">
        <div
          className="FansBarraActiva"
          style={{width: `${Math.min(fans.length, 100)}%`,}}>
        </div>
      </div>
    </section>
  );
}

export default FansUnidos;