import { useRef } from "react";
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

  const hayContenido = highlights.length > 0 || isOwnProfile;
  const hayLugar = highlights.length < MAX_HIGHLIGHTS;

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

          {highlights.map((highlight) => (
            <div className="highlightCard" key={highlight.id_highlight}>
              <img src={highlight.url_imagen} alt="Highlight" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
