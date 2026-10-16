import { useEffect, useRef, useState } from "react";
import { lastfmService, MENSAJE_LASTFM } from "../../services/lastfmService";
import FilaArtistas from "./filaArtistas";
import IconoLastfm from "./iconoLastfm";
import SugerenciasLastfm from "./sugerenciasLastfm";
import "./escuchasPerfil.css";
import { mostrarAviso } from "../../utils/avisos";

const CANCIONES_VISIBLES = 5;

function formatearNumero(numero) {
  return Number(numero || 0).toLocaleString("es-AR");
}

function reproducciones(numero) {
  return `${formatearNumero(numero)} repr.`;
}

function haceCuanto(fechaIso) {
  if (!fechaIso) return "";
  const minutos = Math.round((Date.now() - new Date(fechaIso).getTime()) / 60000);
  if (Number.isNaN(minutos)) return "";
  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "ayer" : `hace ${dias} días`;
}

// Lo de Last.fm se muestra solo acá: nada lleva a la página de Last.fm.
function FilaCancion({ cancion, posicion, detalle, destacado = false }) {
  return (
    <div className={`cancionEscucha ${destacado ? "destacado" : ""}`}>
      {posicion && <span className="cancionEscuchaPosicion">{posicion}</span>}

      {cancion.imagen ? (
        <img className="cancionEscuchaImagen" src={cancion.imagen} alt="" />
      ) : (
        <span className="cancionEscuchaImagen" aria-hidden="true" />
      )}

      <span className="cancionEscuchaInfo">
        <strong>{cancion.nombre}</strong>
        <small>{cancion.artistas.join(", ")}</small>
      </span>

      {detalle && <span className="cancionEscuchaDetalle">{detalle}</span>}
    </div>
  );
}

// Donde public/lastfm-callback.html deja la respuesta de Last.fm.
const CLAVE_RESPUESTA = "fm-lastfm-respuesta";

function borrarRespuestaGuardada() {
  try {
    localStorage.removeItem(CLAVE_RESPUESTA);
  } catch {
    // sin localStorage igual llega por postMessage
  }
}

// Vincular = iniciar sesión en Last.fm (en un popup) y aprobar FanMeet.
// Así se confirma que la cuenta es de quien la vincula, sin importar si el
// mail de Last.fm es otro. El token vuelve por postMessage o, si Last.fm
// cortó el vínculo entre ventanas, por el evento "storage".
function VincularLastfm({ onVinculado }) {
  // "inicial" | "esperando" (popup abierto) | "guardando"
  const [estado, setEstado] = useState("inicial");
  const [error, setError] = useState("");
  const procesado = useRef(false);
  const onVinculadoRef = useRef(onVinculado);

  useEffect(() => {
    onVinculadoRef.current = onVinculado;
  }, [onVinculado]);

  useEffect(() => {
    if (estado !== "esperando") return undefined;

    async function recibir(datos) {
      if (datos?.tipo !== MENSAJE_LASTFM || procesado.current) return;
      procesado.current = true;
      borrarRespuestaGuardada();

      if (!datos.token) {
        setEstado("inicial");
        setError(
          datos.error === "no-disponible"
            ? "Last.fm no está disponible por ahora. Probá más tarde."
            : "No se conectó Last.fm. Podés volver a intentarlo cuando quieras."
        );
        return;
      }

      setEstado("guardando");
      try {
        await lastfmService.vincular(datos.token);
        onVinculadoRef.current();
      } catch (err) {
        setError(err.details?.[0]?.mensaje || err.message);
        setEstado("inicial");
      }
    }

    function alRecibirMensaje(e) {
      if (e.origin === window.location.origin) recibir(e.data);
    }

    function alCambiarStorage(e) {
      if (e.key !== CLAVE_RESPUESTA || !e.newValue) return;
      try {
        recibir(JSON.parse(e.newValue));
      } catch {
        // valor corrupto: se ignora
      }
    }

    window.addEventListener("message", alRecibirMensaje);
    window.addEventListener("storage", alCambiarStorage);
    return () => {
      window.removeEventListener("message", alRecibirMensaje);
      window.removeEventListener("storage", alCambiarStorage);
    };
  }, [estado]);

  function conectar() {
    setError("");
    borrarRespuestaGuardada();

    const popup = window.open(
      lastfmService.urlAutorizacion(),
      "fanmeet-lastfm",
      "popup,width=520,height=720"
    );
    if (!popup) {
      setError(
        "Tu navegador bloqueó la ventana de Last.fm. Permití las ventanas emergentes para FanMeet y probá de nuevo."
      );
      return;
    }

    procesado.current = false;
    setEstado("esperando");
  }

  return (
    <div className="escuchasConectar">
      <IconoLastfm size={34} />

      <p>
        Mostrá los artistas, canciones y álbumes más escuchados. Conectá tu cuenta de Last.fm:
        iniciás sesión ahí y aprobás FanMeet, así confirmamos que es tuya. No hace falta que
        tenga el mismo mail que FanMeet.
      </p>

      {estado === "inicial" && (
        <button className="escuchasBotonConectar" type="button" onClick={conectar}>
          Conectar con Last.fm
        </button>
      )}

      {estado === "esperando" && (
        <div className="escuchasEsperando" role="status">
          <span>Iniciá sesión en la ventana de Last.fm y tocá “Yes, allow access”.</span>
          <button
            className="escuchasAccion"
            type="button"
            onClick={() => {
              procesado.current = true;
              setEstado("inicial");
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {estado === "guardando" && (
        <p className="escuchasEsperando" role="status">
          Confirmando tu cuenta…
        </p>
      )}

      {error && <small className="escuchasAviso">{error}</small>}

      <small className="escuchasAyuda">
        ¿No tenés Last.fm? Creá una cuenta gratis en{" "}
        <a href="https://www.last.fm/join" target="_blank" rel="noopener noreferrer">
          last.fm
        </a>{" "}
        y en Settings → Applications conectá tu Spotify. Desde ahí, todo lo que escuchés se
        registra solo.
      </small>
    </div>
  );
}

export default function EscuchasPerfil({ idUsuario, isOwnProfile, onPerfilMusicalActualizado }) {
  const [escuchas, setEscuchas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [verTodasCanciones, setVerTodasCanciones] = useState(false);
  // Se incrementa para volver a pedir los datos (ej. después de vincular).
  const [recarga, setRecarga] = useState(0);
  // Recién vinculado: ofrecer sumar sus artistas y géneros al perfil.
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  useEffect(() => {
    let cancelado = false;

    lastfmService
      .obtenerEscuchas(idUsuario)
      .then((datos) => {
        if (cancelado) return;
        setEscuchas(datos);
        setError("");
      })
      .catch((err) => {
        console.error("Error cargando escuchas de Last.fm:", err);
        if (!cancelado) setError(err.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [idUsuario, recarga]);

  function recargar() {
    setCargando(true);
    setRecarga((n) => n + 1);
  }

  function manejarVinculado() {
    recargar();
    setMostrarSugerencias(true);
    onPerfilMusicalActualizado?.();
  }

  function terminarSugerencias(agrego) {
    setMostrarSugerencias(false);
    if (agrego) onPerfilMusicalActualizado?.();
  }

  async function manejarDesvincular() {
    try {
      await lastfmService.desvincular();
      setEscuchas({ conectado: false });
      setMostrarSugerencias(false);
      onPerfilMusicalActualizado?.();
    } catch (err) {
      mostrarAviso("No se pudo desvincular Last.fm: " + err.message);
    }
  }

  const conectado = escuchas?.conectado;

  // Perfil ajeno sin Last.fm: no mostramos la sección vacía.
  if (!isOwnProfile && !cargando && !conectado && !error) return null;

  const canciones = escuchas?.topCanciones || [];
  const cancionesVisibles = verTodasCanciones ? canciones : canciones.slice(0, CANCIONES_VISIBLES);
  const recientes = (escuchas?.recientes || []).slice(0, CANCIONES_VISIBLES);
  const sinDatos =
    conectado &&
    !escuchas.topArtistas.length &&
    !canciones.length &&
    !escuchas.topAlbumes.length &&
    !recientes.length;

  return (
    <section className="escuchas">
      <div className="escuchasHeader">
        <h3>Escuchas</h3>

        {conectado && isOwnProfile && (
          <button className="escuchasAccion" type="button" onClick={manejarDesvincular}>
            Desvincular
          </button>
        )}
      </div>

      {error && <p className="escuchasMensaje">No pudimos cargar las escuchas ({error}).</p>}

      {!error && !cargando && !conectado && isOwnProfile && (
        <VincularLastfm onVinculado={manejarVinculado} />
      )}

      {mostrarSugerencias && isOwnProfile && <SugerenciasLastfm onListo={terminarSugerencias} />}

      {!error && conectado && (
        <>
          <p className="escuchasResumen">
            <strong>{formatearNumero(escuchas.total_reproducciones)}</strong> reproducciones en
            total
          </p>

          {/* Solo los últimos 30 días (ver backend/src/services/lastfmService.js) */}
          <p className="escuchasPeriodo">Últimos 30 días</p>

          <div className={`escuchasCuerpo ${cargando ? "cargando" : ""}`}>
            {recientes[0]?.sonando_ahora && (
              <div className="escuchasLista">
                <FilaCancion cancion={recientes[0]} detalle="Sonando ahora" destacado />
              </div>
            )}

            {sinDatos && (
              <p className="escuchasMensaje">No hay escuchas en los últimos 30 días.</p>
            )}

            {escuchas.topArtistas.length > 0 && (
              <div className="escuchasBloque">
                <h4>Top artistas</h4>
                <FilaArtistas
                  sinLink
                  artistas={escuchas.topArtistas}
                  obtenerSubtitulo={(artista, indice) =>
                    `#${indice + 1} · ${reproducciones(artista.reproducciones)}`
                  }
                />
              </div>
            )}

            {canciones.length > 0 && (
              <div className="escuchasBloque escuchasLista">
                <h4>Top canciones</h4>
                {cancionesVisibles.map((cancion, indice) => (
                  <FilaCancion
                    key={cancion.url || cancion.nombre}
                    cancion={cancion}
                    posicion={indice + 1}
                    detalle={reproducciones(cancion.reproducciones)}
                  />
                ))}
                {canciones.length > CANCIONES_VISIBLES && (
                  <button
                    className="escuchasAccion escuchasVerMas"
                    type="button"
                    onClick={() => setVerTodasCanciones((v) => !v)}
                  >
                    {verTodasCanciones ? "Ver menos" : `Ver las ${canciones.length}`}
                  </button>
                )}
              </div>
            )}

            {escuchas.topAlbumes.length > 0 && (
              <div className="escuchasBloque">
                <h4>Top álbumes</h4>
                <FilaArtistas
                  sinLink
                  artistas={escuchas.topAlbumes}
                  cuadrado
                  obtenerSubtitulo={(album) =>
                    `${album.artistas[0] || ""} · ${reproducciones(album.reproducciones)}`
                  }
                />
              </div>
            )}

            {recientes.some((cancion) => !cancion.sonando_ahora) && (
              <div className="escuchasBloque escuchasLista">
                <h4>Escuchado recientemente</h4>
                {recientes
                  .filter((cancion) => !cancion.sonando_ahora)
                  .map((cancion) => (
                    <FilaCancion
                      key={`${cancion.url}-${cancion.escuchado_at}`}
                      cancion={cancion}
                      detalle={haceCuanto(cancion.escuchado_at)}
                    />
                  ))}
              </div>
            )}
          </div>

          <p className="escuchasFuente">
            <IconoLastfm size={14} /> Datos de <strong>Last.fm · {escuchas.usuario_lastfm}</strong>
          </p>
        </>
      )}
    </section>
  );
}
