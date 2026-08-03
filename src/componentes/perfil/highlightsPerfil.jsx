import { useRef } from "react";
import "./highlightsPerfil.css";

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
          Todavía no hay highlights para mostrar.
        </p>
      )}

      {!error && hayContenido && (
        <div className="highlightsPerfilGrid">
          {isOwnProfile && (
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

          {isOwnProfile && (
            <input
              ref={inputArchivoRef}
              type="file"
              accept="image/*"
              onChange={manejarArchivoSeleccionado}
              hidden
            />
          )}

          {highlights.map((highlight, indice) => (
            <div
              className={`highlightCard ${indice === 0 ? "destacado" : ""}`}
              key={highlight.id_highlight}
            >
              <img src={highlight.url_imagen} alt="Highlight" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
