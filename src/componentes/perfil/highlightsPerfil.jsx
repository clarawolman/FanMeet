import { useEffect, useRef, useState } from "react";
import "./highlightsPerfil.css";

const MAX_HIGHLIGHTS = 4;

export default function HighlightsPerfil({
  highlights,
  isOwnProfile,
  subiendo,
  error,
  onSubirHighlight,
}) {
  const inputArchivoRef = useRef(null);
  const [indiceAbierto, setIndiceAbierto] = useState(null);

  function manejarClickAgregar() {
    if (inputArchivoRef.current) {
      inputArchivoRef.current.click();
    }
  }

  function manejarArchivoSeleccionado(e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";

    if (archivo) {
      onSubirHighlight(archivo);
    }
  }

  function irAnterior() {
    setIndiceAbierto((actual) =>
      actual === null ? actual : (actual - 1 + highlights.length) % highlights.length
    );
  }

  function irSiguiente() {
    setIndiceAbierto((actual) =>
      actual === null ? actual : (actual + 1) % highlights.length
    );
  }

  useEffect(() => {
    if (indiceAbierto === null) return;

    function manejarTecla(e) {
      if (e.key === "Escape") setIndiceAbierto(null);
      if (e.key === "ArrowLeft") irAnterior();
      if (e.key === "ArrowRight") irSiguiente();
    }

    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [indiceAbierto, highlights.length]);

  const hayContenido = highlights.length > 0 || isOwnProfile;
  const hayLugar = highlights.length < MAX_HIGHLIGHTS;
  const highlightAbierto =
    indiceAbierto !== null ? highlights[indiceAbierto] : null;

  return (
    <section className="highlightsPerfil">
      <div className="highlightsPerfilHeader">
        <h3>Highlights</h3>
      </div>

      {error && (
        <p className="highlightsPerfilVacio">
          No pudimos cargar los highlights ({error}).
        </p>
      )}

      {!error && !hayContenido && (
        <p className="highlightsPerfilVacio">
          No hay highlights.
        </p>
      )}

      {!error && hayContenido && (
        <div className="highlightsPerfilGrid">
          {isOwnProfile && hayLugar && (
            <button
              className="highlightAddCard"
              type="button"
              onClick={manejarClickAgregar}
              disabled={subiendo}
              aria-label="Agregar highlight"
            >
              {subiendo ? "…" : "+"}
            </button>
          )}

          {isOwnProfile && hayLugar && (
            <input
              ref={inputArchivoRef}
              type="file"
              accept="image/*"
              onChange={manejarArchivoSeleccionado}
              hidden
            />
          )}

          {highlights.map((highlight, indice) => (
            <button
              className="highlightCard"
              type="button"
              key={highlight.id_highlight}
              onClick={() => setIndiceAbierto(indice)}
              aria-label="Ver highlight"
            >
              <img src={highlight.url_imagen} alt="Highlight" />
            </button>
          ))}
        </div>
      )}

      {highlightAbierto && (
        <div
          className="highlightOverlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setIndiceAbierto(null)}
        >
          <div className="highlightOverlayBarras">
            {highlights.map((highlight, indice) => (
              <span
                key={highlight.id_highlight}
                className={`highlightOverlayBarra ${
                  indice === indiceAbierto ? "activa" : ""
                }`}
              />
            ))}
          </div>

          <button
            className="highlightOverlayCerrar"
            type="button"
            onClick={() => setIndiceAbierto(null)}
            aria-label="Cerrar"
          >
            ✕
          </button>

          <img
            className="highlightOverlayImagen"
            src={highlightAbierto.url_imagen}
            alt="Highlight"
            onClick={(e) => e.stopPropagation()}
          />

          {highlights.length > 1 && (
            <>
              <button
                className="highlightOverlayNav highlightOverlayNavPrev"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  irAnterior();
                }}
                aria-label="Anterior"
              >
                ‹
              </button>

              <button
                className="highlightOverlayNav highlightOverlayNavNext"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  irSiguiente();
                }}
                aria-label="Siguiente"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
