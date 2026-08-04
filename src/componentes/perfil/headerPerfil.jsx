import { useRef } from "react";
import "./headerPerfil.css";
import BotonAmistad from "./botonAmistad";

export default function HeaderPerfil({
  usuario,
  isOwnProfile,
  estadoAmistad,
  onAccionAmistad,
  onSubirFoto,
  subiendoFoto,
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
        <p className="headerPerfilEyebrow">FanMeet</p>
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
          <BotonAmistad estado={estadoAmistad} onAccion={onAccionAmistad} deshabilitado />
        )}
      </div>
    </div>
  );
}
