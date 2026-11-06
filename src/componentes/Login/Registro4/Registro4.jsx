import { useState } from "react";
import "./Registro4.css";
import EncabezadoRegistro from "../EncabezadoRegistro";
import { IconoPogo, IconoSentado, IconoPrimeraFila } from "../../perfil/vibraIconos";

const ambientes = [
  {
    id: "pogo",
    titulo: "Pogos, campos",
    descripcion: "Mucha energía, sudor y movimiento.",
    icono: <IconoPogo />,
  },
  {
    id: "tranquilo",
    titulo: "Platea",
    descripcion: "Sentado y relajado con una bebida.",
    icono: <IconoSentado />,
  },
  {
    id: "campo",
    titulo: "Primera fila",
    descripcion: "Ojos en el escenario, cantando cada palabra.",
    icono: <IconoPrimeraFila />,
  },
];

function Registro4({ datosIniciales = {}, onVolver, onSiguiente }) {
  const [ambienteSeleccionado, setAmbienteSeleccionado] = useState(
    datosIniciales.estilo_asistencia || ""
  );

  return (
    <main className="regPantalla">
      <EncabezadoRegistro
        paso={4}
        onVolver={() => onVolver({ estilo_asistencia: ambienteSeleccionado })}
        onOmitir={() => onSiguiente({ estilo_asistencia: "" })}
      />

      <section className="regContenido">
        <h1 className="regTitulo" id="registro4Titulo">¿Cómo vivís un recital?</h1>
        <p className="regBajada">Lo podés cambiar cuando quieras desde tu perfil.</p>

        <div className="registro4Ambientes" role="group" aria-labelledby="registro4Titulo">
          {ambientes.map((ambiente) => {
            const activo = ambienteSeleccionado === ambiente.id;

            return (
              <button
                key={ambiente.id}
                className={`registro4Ambiente ${activo ? "activo" : ""}`}
                type="button"
                aria-pressed={activo}
                // Tocar la opción elegida la desmarca: el paso es opcional.
                onClick={() => setAmbienteSeleccionado(activo ? "" : ambiente.id)}
              >
                <span className="registro4AmbienteIcono" aria-hidden="true">
                  {ambiente.icono}
                </span>

                <span className="registro4AmbienteTexto">
                  <strong>{ambiente.titulo}</strong>
                  <small>{ambiente.descripcion}</small>
                </span>

                <span className="registro4Check" aria-hidden="true">
                  {activo && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="regPie">
          <button
            className="fmBotonPrimario regBotonSiguiente"
            type="button"
            onClick={() => onSiguiente({ estilo_asistencia: ambienteSeleccionado })}
          >
            Siguiente
          </button>
        </div>
      </section>
    </main>
  );
}

export default Registro4;
