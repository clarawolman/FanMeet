import "./SubEventos.css";
import { formatearFechaDMA } from "../../utils/fechas";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80";

// Mismos nombres que los filtros de Concierto.jsx
const CATEGORIAS = {
  pre: "Pre",
  after: "After",
  mismo_dia: "Hoy",
};

function SubEventos({ subEvento, onAbrirGrupo }) {
  return (
    <section className="SubEventoCard" onClick={() => onAbrirGrupo(subEvento)}>

      <img
        className="SubEventoImagen"
        src={subEvento.foto || subEvento.imagen || FALLBACK_IMG}
        alt={subEvento.nombre}
      />

      <div className="SubEventoOverlay" />

      {CATEGORIAS[subEvento.categoria] && (
        <span className="SubEventoCategoria">{CATEGORIAS[subEvento.categoria]}</span>
      )}

      <div className="SubEventoContenido">
        <h3 className="SubEventoTitulo">{subEvento.nombre}</h3>

        <p className="SubEventoInfo">
          {subEvento.ubicacion} · {formatearFechaDMA(subEvento.fecha)}
        </p>

        <div className="SubEventoUsuarios">
          <div className="SubEventoAvatares">
            {subEvento.usuarios.slice(0, 3).map((usuario) => (
              <img
                key={usuario.id_usuario}
                className="SubEventoAvatar"
                src={usuario.foto_perfil}
                alt={usuario.nombre}
              />
            ))}
          </div>

          {subEvento.usuarios.length > 3 && (
            <span className="SubEventoExtra">
              +{subEvento.usuarios.length - 3}
            </span>
          )}

          <span className="SubEventoAsistiran">
            {subEvento.usuarios.length} asistirán
          </span>
        </div>

        <button
          className="SubEventoBoton"
          onClick={(e) => {
            if (window.__carouselDragging) return;

            e.stopPropagation();
            onAbrirGrupo(subEvento);
          }}
        >
          Ver más
        </button>
      </div>
    </section>
  );
}

export default SubEventos;