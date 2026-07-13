import ParticipantesGrupo from "../infoGrupos/participantesGrupo";
import "./FansUnidos.css";

function FansUnidos({ fans = [], cantidadFans = 0 }) {
    return (
    <section className="FansUnidosCard">
      <p className="FansSubtitulo"> Fans unidos: </p>
      <h2 className="FansCantidad"> {cantidadFans} </h2>
      <button className="FansTexto"> ¡Conocelos!</button> {/* falta link a la pagina de usuarios unidos */}
      <div className="FansBarra">
        <div
          className="FansBarraActiva"
          style={{width: `${Math.min(cantidadFans, 100)}%`,}}>
        </div>
      </div>
    </section>
  );
}

export default FansUnidos;