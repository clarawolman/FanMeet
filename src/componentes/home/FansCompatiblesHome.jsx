import CarruselFila from "./CarruselFila";
import BotonConectar from "../generales/BotonConectar";
import "./FansCompatiblesHome.css";

const MAX_FANS = 10;

// Fila de la home con los fans más compatibles (60% o más); "Ver todos"
// lleva a Descubrir. Si nadie llega al 60% (soloCercanos), muestra los
// más parecidos con un aviso.
export default function FansCompatiblesHome({ fans, soloCercanos, onVerUsuario, onVerTodos }) {
  return (
    <section className="home-row">
      <div className="home-row-header">
        <h2>{soloCercanos ? "Fans parecidos a vos" : "Fans con tus gustos"}</h2>
        <button type="button" className="fansHomeVerTodos" onClick={onVerTodos}>
          Ver todos
        </button>
      </div>

      {soloCercanos && (
        <p className="fansHomeAviso">
          Nadie llega al 60% de compatibilidad todavía: estos son los más cercanos.
        </p>
      )}

      <CarruselFila>
        {fans.slice(0, MAX_FANS).map((fan) => (
          <article key={fan.id_usuario} className="fansHomeItem">
            <button
              type="button"
              className="fansHomePerfil"
              onClick={() => onVerUsuario(fan.id_usuario)}
            >
              <span className="fansHomeFotoWrap">
                <img className="fansHomeFoto" src={fan.foto_perfil} alt="" draggable={false} />
                <span className="fansHomePorcentaje">{fan.porcentaje}%</span>
              </span>
              <strong>{fan.nombre}</strong>
              {fan.generosEnComun[0] && <small>Le gusta {fan.generosEnComun[0]}</small>}
            </button>

            <BotonConectar fan={fan} className="fansHomeConectar" />
          </article>
        ))}
      </CarruselFila>
    </section>
  );
}
