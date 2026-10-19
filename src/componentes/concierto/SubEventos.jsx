import { useContext } from "react";
import "./SubEventos.css";
import { partesFecha } from "../../utils/fechas";
import { UsuarioContext } from "../../context/UsuarioContext";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80";

// Mismos nombres que los filtros de Concierto.jsx
const CATEGORIAS = {
  pre: "Pre",
  after: "After",
  mismo_dia: "Hoy",
};

// Card de un grupo: foto a sangre, chip de categoría, fecha como talón
// y quiénes van. Toda la card abre el grupo.
function SubEventos({ subEvento, onAbrirGrupo }) {
  const { usuarioActual } = useContext(UsuarioContext);
  const usuarios = subEvento.usuarios || [];
  const fecha = partesFecha(subEvento.fecha);
  const hora = subEvento.hora?.slice(0, 5);
  const voy = usuarios.some((u) => u.id_usuario === usuarioActual?.id_usuario);
  const completo = Boolean(subEvento.cupo) && usuarios.length >= subEvento.cupo;

  return (
    <button
      type="button"
      className="SubEventoCard"
      onClick={() => !window.__carouselDragging && onAbrirGrupo(subEvento)}
    >
      <img className="SubEventoImagen" src={subEvento.foto || subEvento.imagen || FALLBACK_IMG} alt="" />
      <span className="SubEventoOverlay" />

      <span className="SubEventoArriba">
        {CATEGORIAS[subEvento.categoria] && (
          <span className="SubEventoCategoria">{CATEGORIAS[subEvento.categoria]}</span>
        )}
        {voy && <span className="SubEventoVoy">Vas</span>}
        {completo && !voy && <span className="SubEventoCompleto">Completo</span>}
      </span>

      {fecha && (
        <span className="SubEventoFecha" aria-hidden="true">
          <strong>{fecha.dia}</strong>
          <span>{fecha.mes}</span>
        </span>
      )}

      <span className="SubEventoContenido">
        <span className="SubEventoTitulo">{subEvento.nombre}</span>

        <span className="SubEventoInfo">
          {[hora && `${hora} h`, subEvento.ubicacion].filter(Boolean).join(" · ")}
        </span>

        <span className="SubEventoUsuarios">
          {usuarios.length > 0 && (
            <span className="SubEventoAvatares">
              {usuarios.slice(0, 3).map((usuario) => (
                <img key={usuario.id_usuario} className="SubEventoAvatar" src={usuario.foto_perfil} alt="" />
              ))}
            </span>
          )}
          <span className="SubEventoAsistiran">
            {subEvento.cupo
              ? `${usuarios.length}/${subEvento.cupo} lugares`
              : usuarios.length === 0
                ? "Sé el primero en sumarte"
                : `${usuarios.length} ${usuarios.length === 1 ? "va" : "van"}`}
          </span>
          <svg className="SubEventoFlecha" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </span>
    </button>
  );
}

export default SubEventos;
