import CarruselFila from "./CarruselFila";
import "./FansCompatiblesHome.css";

const MAX_FANS = 10;

// Fila de la home con los fans más compatibles; "Ver todos" lleva a Descubrir.
export default function FansCompatiblesHome({ fans, onVerUsuario, onVerTodos }) {
  return (
    <section className="home-row">
      <div className="home-row-header">
        <h2>Fans con tus gustos</h2>
        <button type="button" className="fansHomeVerTodos" onClick={onVerTodos}>
          Ver todos
        </button>
      </div>

      <CarruselFila>
        {fans.slice(0, MAX_FANS).map((fan) => (
          <button
            key={fan.id_usuario}
            type="button"
            className="fansHomeItem"
            onClick={() => onVerUsuario(fan.id_usuario)}
          >
            <span className="fansHomeFotoWrap">
              <img className="fansHomeFoto" src={fan.foto_perfil} alt="" draggable={false} />
              <span className="fansHomePorcentaje">{fan.porcentaje}%</span>
            </span>
            <strong>{fan.nombre}</strong>
            {fan.artistasEnComun[0] && <small>{fan.artistasEnComun[0]}</small>}
          </button>
        ))}
      </CarruselFila>
    </section>
  );
}
