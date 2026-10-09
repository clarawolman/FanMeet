import { useEffect, useState } from "react";
import { lastfmService } from "../../services/lastfmService";
import FilaArtistas from "./filaArtistas";
import IconoLastfm from "./iconoLastfm";
import "./escuchasPerfil.css";

// Los mismos períodos que ofrece la web de Last.fm.
const PERIODOS = [
  { id: "semana", nombre: "7 días" },
  { id: "mes", nombre: "1 mes" },
  { id: "trimestre", nombre: "3 meses" },
  { id: "semestre", nombre: "6 meses" },
  { id: "anio", nombre: "1 año" },
  { id: "siempre", nombre: "Siempre" },
];

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

function FilaCancion({ cancion, posicion, detalle, destacado = false }) {
  return (
    <a
      className={`cancionEscucha ${destacado ? "destacado" : ""}`}
      href={cancion.url}
      target="_blank"
      rel="noopener noreferrer"
    >
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
    </a>
  );
}

function VincularLastfm({ onVinculado }) {
  const [usuario, setUsuario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function manejarEnviar(e) {
    e.preventDefault();
    const limpio = usuario.trim();
    if (!limpio) return;

    setGuardando(true);
    setError("");
    try {
      await lastfmService.vincular(limpio);
      onVinculado();
    } catch (err) {
      setError(err.details?.[0]?.mensaje || err.message);
    }
    setGuardando(false);
  }

  return (
    <div className="escuchasConectar">
      <IconoLastfm size={34} />

      <p>
        Mostrá tus artistas, canciones y álbumes más escuchados. Escribí tu usuario de Last.fm
        y listo.
      </p>

      <form className="escuchasForm" onSubmit={manejarEnviar}>
        <input
          className="escuchasInput"
          type="text"
          placeholder="Tu usuario de Last.fm"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={15}
        />
        <button
          className="escuchasBotonConectar"
          type="submit"
          disabled={guardando || !usuario.trim()}
        >
          {guardando ? "Buscando…" : "Vincular"}
        </button>
      </form>

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

export default function EscuchasPerfil({ idUsuario, isOwnProfile }) {
  const [periodo, setPeriodo] = useState("mes");
  const [escuchas, setEscuchas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [verTodasCanciones, setVerTodasCanciones] = useState(false);
  // Se incrementa para volver a pedir los datos (ej. después de vincular).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let cancelado = false;

    lastfmService
      .obtenerEscuchas(idUsuario, periodo)
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
  }, [idUsuario, periodo, recarga]);

  function recargar() {
    setCargando(true);
    setRecarga((n) => n + 1);
  }

  function cambiarPeriodo(nuevoPeriodo) {
    if (nuevoPeriodo === periodo) return;
    setCargando(true);
    setPeriodo(nuevoPeriodo);
  }

  async function manejarDesvincular() {
    try {
      await lastfmService.desvincular();
      setEscuchas({ conectado: false });
    } catch (err) {
      alert("No se pudo desvincular Last.fm: " + err.message);
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
        <h3>{isOwnProfile ? "Lo que escuchás" : "Lo que escucha"}</h3>

        {conectado && isOwnProfile && (
          <button className="escuchasAccion" type="button" onClick={manejarDesvincular}>
            Desvincular
          </button>
        )}
      </div>

      {error && <p className="escuchasMensaje">No pudimos cargar lo que escucha ({error}).</p>}

      {!error && !cargando && !conectado && isOwnProfile && (
        <VincularLastfm onVinculado={recargar} />
      )}

      {!error && conectado && (
        <>
          <p className="escuchasResumen">
            <strong>{formatearNumero(escuchas.total_reproducciones)}</strong> reproducciones en
            total
          </p>

          <div className="escuchasRangos" role="tablist">
            {PERIODOS.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                role="tab"
                aria-selected={periodo === opcion.id}
                className={`escuchasRango ${periodo === opcion.id ? "activo" : ""}`}
                onClick={() => cambiarPeriodo(opcion.id)}
              >
                {opcion.nombre}
              </button>
            ))}
          </div>

          <div className={`escuchasCuerpo ${cargando ? "cargando" : ""}`}>
            {recientes[0]?.sonando_ahora && (
              <div className="escuchasLista">
                <FilaCancion cancion={recientes[0]} detalle="Sonando ahora" destacado />
              </div>
            )}

            {sinDatos && (
              <p className="escuchasMensaje">Todavía no hay escuchas registradas en este período.</p>
            )}

            {escuchas.topArtistas.length > 0 && (
              <div className="escuchasBloque">
                <h4>Top artistas</h4>
                <FilaArtistas
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
            <IconoLastfm size={14} /> Datos de{" "}
            <a href={escuchas.url_perfil} target="_blank" rel="noopener noreferrer">
              Last.fm · {escuchas.usuario_lastfm}
            </a>
          </p>
        </>
      )}
    </section>
  );
}
