import { useRef } from "react";
import "./headerPerfil.css";
import BotonAmistad from "./botonAmistad";
import IconoCampana from "../generales/IconoCampana";
import signOutIcono from "../../assets/signOut.png";

export default function HeaderPerfil({
  usuario,
  isOwnProfile,
  estadoAmistad,
  amistadDeshabilitada,
  onAccionAmistad,
  onSubirFoto,
  subiendoFoto,
  onVolver,
  onNavegar,
  onCerrarSesion,
}) {
  const inputFotoRef = useRef(null);

  function manejarClickEditar() {
    if (inputFotoRef.current) {
      inputFotoRef.current.click();
    }
  }

  function manejarArchivoSeleccionado(e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";

    if (archivo) {
      onSubirFoto(archivo);
    }
  }

  return (
    <div className="headerPerfil">
      <header className="headerPerfilTop">
        {onVolver && (
          <button
            className="headerPerfilVolver"
            type="button"
            onClick={onVolver}
            aria-label="Volver"
          >
            ←
          </button>
        )}

        <p className="headerPerfilEyebrow">FanMeet</p>

        {isOwnProfile && (
          <div className="headerPerfilAcciones">
            {onNavegar && (
              <button
                className="headerPerfilCampana"
                type="button"
                onClick={() => onNavegar("notificaciones")}
                aria-label="Notificaciones"
              >
                <IconoCampana />
              </button>
            )}

            {onCerrarSesion && (
              <button
                className="headerPerfilCerrarSesion"
                type="button"
                onClick={onCerrarSesion}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <img src={signOutIcono} alt="" />
              </button>
            )}
          </div>
        )}
      </header>

      <div className="headerPerfilInfo">
        <div className="headerPerfilFotoWrap">
          <img
            className="headerPerfilFoto"
            src={usuario?.fotoperfil || usuario?.foto_perfil}
            alt={usuario?.nombre}
          />

          {isOwnProfile && (
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/*"
              onChange={manejarArchivoSeleccionado}
              hidden
            />
          )}
        </div>

        <div className="headerPerfilIdentidad">
          <h2 className="headerPerfilNombre">{usuario?.nombre}</h2>
          {usuario?.nombre && (
            <p className="headerPerfilHandle">@{usuario.nombre}</p>
          )}
        </div>

        {isOwnProfile ? (
          <button
            className="headerPerfilBotonEditar"
            type="button"
            onClick={manejarClickEditar}
            disabled={subiendoFoto}
          >
            {subiendoFoto ? "Subiendo foto…" : "Editar perfil"}
          </button>
        ) : (
          <BotonAmistad
            estado={estadoAmistad}
            onAccion={onAccionAmistad}
            deshabilitado={amistadDeshabilitada}
          />
        )}
      </div>
    </div>
  );
}
