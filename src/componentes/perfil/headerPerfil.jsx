import { useRef } from "react";
import "./headerPerfil.css";
import BotonAmistad from "./botonAmistad";
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

        {isOwnProfile && onCerrarSesion && (
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
      </header>

      <div className="headerPerfilInfo">
        <div className="headerPerfilFotoWrap">
          <img
            className="headerPerfilFoto"
            src={usuario?.fotoperfil || usuario?.foto_perfil}
            alt={usuario?.nombre}
          />

          {isOwnProfile && (
            <button
              className="headerPerfilFotoEditar"
              type="button"
              onClick={manejarClickEditar}
              disabled={subiendoFoto}
              aria-label="Cambiar foto"
            >
              {subiendoFoto ? "…" : "✎"}
            </button>
          )}

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

        <h2 className="headerPerfilNombre">{usuario?.nombre}</h2>

        {!isOwnProfile && (
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
