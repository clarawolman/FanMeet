import "./headerPerfil.css";
import BotonAmistad from "./botonAmistad";

export default function HeaderPerfil({
  usuario,
  isOwnProfile,
  estadoAmistad,
  onAccionAmistad,
  onEditarFoto,
}) {
  return (
    <div className="headerPerfil">
      <div className="headerPerfilTop">
        <button className="headerPerfilIconBtn" type="button" aria-label="Menú">
          ☰
        </button>

        <p className="headerPerfilEyebrow">FanMeet</p>

        {isOwnProfile ? (
          <button
            className="headerPerfilIconBtn"
            type="button"
            aria-label="Notificaciones"
          >
            🔔
          </button>
        ) : (
          <BotonAmistad
            estado={estadoAmistad}
            onAccion={onAccionAmistad}
            deshabilitado
          />
        )}
      </div>

      <div className="headerPerfilInfo">
        <div className="headerPerfilFotoWrap">
          <img
            className="headerPerfilFoto"
            src={usuario?.foto_perfil}
            alt={usuario?.nombre}
          />

          {isOwnProfile && (
            <button
              className="headerPerfilFotoEditar"
              type="button"
              onClick={onEditarFoto}
              aria-label="Cambiar foto"
            >
              ✎
            </button>
          )}
        </div>

        <h2 className="headerPerfilNombre">{usuario?.nombre}</h2>
      </div>
    </div>
  );
}
