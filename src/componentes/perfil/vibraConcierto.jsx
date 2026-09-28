import { useState } from "react";
import "./vibraConcierto.css";

export default function VibraConcierto({
  vibras,
  vibraActual,
  isOwnProfile,
  onSeleccionar,
}) {
  const [cambiando, setCambiando] = useState(false);

  const vibraElegida = vibras.find((vibra) => vibra.id === vibraActual) || null;

  function manejarSeleccionar(idVibra) {
    onSeleccionar(idVibra);
    setCambiando(false);
  }

  if (!vibraElegida) {
    if (!isOwnProfile) {
      return (
        <section className="vibraConcierto">
          <h3>Mi vibe de concierto</h3>
          <p className="vibraConciertoVacio">Todavía no eligió su vibe de concierto.</p>
        </section>
      );
    }

    return (
      <section className="vibraConcierto">
        <h3>Mi vibe de concierto</h3>
        <p className="vibraConciertoVacio">
          Todavía no elegiste tu vibe de concierto.
        </p>

        <div className="vibraConciertoOpciones">
          {vibras.map((vibra) => (
            <button
              key={vibra.id}
              type="button"
              className="vibraOpcion"
              onClick={() => manejarSeleccionar(vibra.id)}
            >
              <span className="vibraOpcionIcono">{vibra.icono}</span>

              <span className="vibraOpcionTexto">
                <strong>{vibra.nombre}</strong>
                <small>{vibra.descripcion}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="vibraConcierto">
      <div className="vibraConciertoHeader">
        <h3>Mi vibe de concierto</h3>

        {isOwnProfile && (
          <button
            className="vibraConciertoCambiar"
            type="button"
            onClick={() => setCambiando((actual) => !actual)}
          >
            {cambiando ? "Cerrar" : "Cambiar"}
          </button>
        )}
      </div>

      {!cambiando && (
        <div className="vibraResultado">
          <span className="vibraResultadoIcono">{vibraElegida.icono}</span>

          <span className="vibraResultadoTexto">
            <strong>{vibraElegida.nombre}</strong>
            <small>{vibraElegida.descripcion}</small>
          </span>
        </div>
      )}

      {cambiando && isOwnProfile && (
        <div className="vibraConciertoOpciones">
          {vibras.map((vibra) => {
            const activa = vibra.id === vibraActual;

            return (
              <button
                key={vibra.id}
                type="button"
                className={`vibraOpcion ${activa ? "activo" : ""}`}
                onClick={() => manejarSeleccionar(vibra.id)}
              >
                <span className="vibraOpcionIcono">{vibra.icono}</span>

                <span className="vibraOpcionTexto">
                  <strong>{vibra.nombre}</strong>
                  <small>{vibra.descripcion}</small>
                </span>

                <span className="vibraOpcionRadio" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
