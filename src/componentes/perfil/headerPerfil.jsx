import { useRef, useState } from "react";
import "./headerPerfil.css";
import BotonAmistad from "./botonAmistad";
import HeaderApp from "../generales/HeaderApp";
import IconoCampana from "../generales/IconoCampana";
import { IconoNavSalir } from "../generales/iconosNav";

// Mismas reglas que el backend (usuarioValidators.js / usuarioService.js)
const REGEX_NOMBRE_USUARIO = /^[a-zA-Z0-9._]{3,30}$/;
const MAX_DESCRIPCION = 160;
const DIAS_ENTRE_CAMBIOS_DE_NOMBRE = 15;

// Desde cuándo puede volver a cambiar su @nombre (null = ya puede)
function proximoCambioDeNombre(nombreCambiadoAt) {
  if (!nombreCambiadoAt) return null;
  const proximo = new Date(nombreCambiadoAt);
  proximo.setDate(proximo.getDate() + DIAS_ENTRE_CAMBIOS_DE_NOMBRE);
  return proximo > new Date() ? proximo : null;
}

export default function HeaderPerfil({
  usuario,
  isOwnProfile,
  estadoAmistad,
  amistadDeshabilitada,
  onAccionAmistad,
  onSubirFoto,
  subiendoFoto,
  onGuardarPerfil,
  onVolver,
  onNavegar,
  onCerrarSesion,
  onEnviarMensaje,
  onReportar,
}) {
  const inputFotoRef = useRef(null);
  const [editando, setEditando] = useState(false);
  const [apodo, setApodo] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errorNombre, setErrorNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Como en Instagram: el nombre/apodo es opcional; sin él se ve el usuario.
  const nombreVisible = usuario?.apodo || usuario?.nombre;
  const proximoCambio = proximoCambioDeNombre(usuario?.nombre_cambiado_at);

  function abrirEdicion() {
    setApodo(usuario?.apodo || "");
    setNombreUsuario(usuario?.nombre || "");
    setDescripcion(usuario?.descripcion || "");
    setErrorNombre("");
    setEditando(true);
  }

  async function manejarGuardar(e) {
    e.preventDefault();

    const cambios = { apodo: apodo.trim(), descripcion: descripcion.trim() };
    // El @ solo se manda si cambió: así no cuenta para los 15 días.
    const nombreNuevo = nombreUsuario.trim().replace(/^@/, "");
    if (nombreNuevo !== usuario?.nombre) {
      if (!REGEX_NOMBRE_USUARIO.test(nombreNuevo)) {
        setErrorNombre("De 3 a 30 letras, números, puntos o guiones bajos, sin espacios.");
        return;
      }
      cambios.nombre = nombreNuevo;
    }

    setGuardando(true);
    const ok = await onGuardarPerfil(cambios);
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
          <h2 className="headerPerfilNombre">{nombreVisible}</h2>
          {usuario?.nombre && (
            <p className="headerPerfilHandle">@{usuario.nombre}</p>
          )}
        </div>

        {!editando && usuario?.descripcion && (
          <p className="headerPerfilDescripcion">{usuario.descripcion}</p>
        )}

        {editando && (
          <form id="headerPerfilFormApodo" className="headerPerfilFormulario" onSubmit={manejarGuardar}>
            <div className="headerPerfilCampo">
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
            </div>

            <div className="headerPerfilCampo">
              <label className="headerPerfilApodoLabel" htmlFor="perfil-usuario">
                Nombre de usuario
              </label>
              <div className="headerPerfilUsuarioInput">
                <span aria-hidden="true">@</span>
                <input
                  id="perfil-usuario"
                  className="headerPerfilApodoInput"
                  type="text"
                  maxLength={30}
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                  value={nombreUsuario}
                  onChange={(e) => {
                    setNombreUsuario(e.target.value);
                    setErrorNombre("");
                  }}
                  disabled={Boolean(proximoCambio)}
                  aria-describedby="perfil-usuario-ayuda"
                  aria-invalid={Boolean(errorNombre)}
                />
              </div>
              <p
                id="perfil-usuario-ayuda"
                className={`headerPerfilAyuda ${errorNombre ? "headerPerfilAyuda--error" : ""}`}
              >
                {errorNombre ||
                  (proximoCambio
                    ? `Lo podés volver a cambiar desde el ${proximoCambio.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}.`
                    : `Es con el que iniciás sesión. Lo podés cambiar una vez cada ${DIAS_ENTRE_CAMBIOS_DE_NOMBRE} días.`)}
              </p>
            </div>

            <div className="headerPerfilCampo">
              <label className="headerPerfilApodoLabel" htmlFor="perfil-descripcion">
                Descripción <span>(opcional)</span>
              </label>
              <textarea
                id="perfil-descripcion"
                className="headerPerfilApodoInput headerPerfilDescripcionInput"
                maxLength={MAX_DESCRIPCION}
                rows={3}
                placeholder="Contá qué música te mueve, a qué recitales vas…"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              <p className="headerPerfilAyuda headerPerfilContador">
                {descripcion.length}/{MAX_DESCRIPCION}
              </p>
            </div>
          </form>
        )}

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
