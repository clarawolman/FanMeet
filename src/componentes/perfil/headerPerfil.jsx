import { useRef, useState } from "react";
import "./headerPerfil.css";
import BotonAmistad from "./botonAmistad";
import HeaderApp from "../generales/HeaderApp";
import IconoCampana from "../generales/IconoCampana";
import { IconoNavSalir } from "../generales/iconosNav";

export default function HeaderPerfil({
  usuario,
  isOwnProfile,
  estadoAmistad,
  amistadDeshabilitada,
  onAccionAmistad,
  onSubirFoto,
  subiendoFoto,
  onGuardarApodo,
  onVolver,
  onNavegar,
  onCerrarSesion,
  onEnviarMensaje,
  onReportar,
}) {
  const inputFotoRef = useRef(null);
  const [editando, setEditando] = useState(false);
  const [apodo, setApodo] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Como en Instagram: el nombre/apodo es opcional; sin él se ve el usuario.
  const nombreVisible = usuario?.apodo || usuario?.nombre;

  function abrirEdicion() {
    setApodo(usuario?.apodo || "");
    setEditando(true);
  }

  async function manejarGuardar(e) {
    e.preventDefault();
    setGuardando(true);
    const ok = await onGuardarApodo(apodo.trim());
    setGuardando(false);
    if (ok) setEditando(false);
  }

  function manejarClickCambiarFoto() {
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
      <HeaderApp
        onVolver={onVolver}
        titulo={onVolver ? nombreVisible : undefined}
        acciones={
          isOwnProfile && (
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
                  <IconoNavSalir />
                </button>
              )}
            </div>
          )
        }
      />

      <div className="headerPerfilInfo">
        <div className="headerPerfilFotoWrap">
          <img
            className="headerPerfilFoto"
            src={usuario?.fotoperfil || usuario?.foto_perfil}
            alt={nombreVisible}
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
          {editando ? (
            <form id="headerPerfilFormApodo" onSubmit={manejarGuardar}>
              <label className="headerPerfilApodoLabel" htmlFor="perfil-apodo">
                Nombre <span>(opcional)</span>
              </label>
              <input
                id="perfil-apodo"
                className="headerPerfilApodoInput"
                type="text"
                maxLength={30}
                placeholder="Cómo querés que te vean"
                value={apodo}
                onChange={(e) => setApodo(e.target.value)}
                autoFocus
              />
            </form>
          ) : (
            <h2 className="headerPerfilNombre">{nombreVisible}</h2>
          )}
          {usuario?.nombre && (
            <p className="headerPerfilHandle">@{usuario.nombre}</p>
          )}
        </div>

        {isOwnProfile && editando ? (
          <div className="headerPerfilAccionesEdicion">
            <button
              className="headerPerfilBotonEditar"
              type="button"
              onClick={manejarClickCambiarFoto}
              disabled={subiendoFoto}
            >
              {subiendoFoto ? "Subiendo foto…" : "Cambiar foto"}
            </button>
            <button
              className="headerPerfilBotonEditar"
              type="button"
              onClick={() => setEditando(false)}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              className="fmBotonPrimario headerPerfilBotonGuardar"
              type="submit"
              form="headerPerfilFormApodo"
              disabled={guardando}
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        ) : isOwnProfile ? (
          <button
            className="headerPerfilBotonEditar"
            type="button"
            onClick={abrirEdicion}
          >
            Editar perfil
          </button>
        ) : (
          <div className="headerPerfilAccionesAmistad">
            <BotonAmistad
              estado={estadoAmistad}
              onAccion={onAccionAmistad}
              deshabilitado={amistadDeshabilitada}
            />
            {estadoAmistad === "amigos" && onEnviarMensaje && (
              <button
                className="botonAmistad conectar"
                type="button"
                onClick={onEnviarMensaje}
              >
                Mensaje
              </button>
            )}
            {onReportar && (
              <button
                className="headerPerfilReportar"
                type="button"
                onClick={onReportar}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 22V4" />
                  <path d="M4 4h12l-2 4 2 4H4" />
                </svg>
                Reportar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
