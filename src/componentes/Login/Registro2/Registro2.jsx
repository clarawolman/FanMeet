import { useState } from "react";
import EncabezadoRegistro from "../EncabezadoRegistro";
import SelectorGeneros from "../../generales/SelectorGeneros";

const MIN_GENEROS = 2;

// Último paso obligatorio: sin al menos 2 géneros no se puede seguir.
function Registro2({ datosIniciales = {}, onVolver, onSiguiente }) {
  const [generosSeleccionados, setGenerosSeleccionados] = useState(
    datosIniciales.generos || []
  );
  const [error, setError] = useState("");

  function manejarSiguiente() {
    if (generosSeleccionados.length < MIN_GENEROS) {
      setError(`Elegí al menos ${MIN_GENEROS} géneros para seguir.`);
      return;
    }

    onSiguiente({ generos: generosSeleccionados });
  }

  return (
    <main className="regPantalla">
      <EncabezadoRegistro paso={2} onVolver={() => onVolver({ generos: generosSeleccionados })} />

      <section className="regContenido">
        <h1 className="regTitulo">¿Qué escuchás?</h1>
        <p className="regBajada">Elegí al menos {MIN_GENEROS} géneros. Con eso armamos tus recomendaciones y tus matches.</p>

        <SelectorGeneros
          seleccionados={generosSeleccionados}
          maxPopulares={5}
          onCambiar={(lista) => {
            setError("");
            setGenerosSeleccionados(lista);
          }}
        />

        <div className="regPie">
          {error && (
            <p className="fmAvisoError regError" role="alert">
              {error}
            </p>
          )}

          <button className="fmBotonPrimario regBotonSiguiente" type="button" onClick={manejarSiguiente}>
            Siguiente
          </button>
        </div>
      </section>
    </main>
  );
}

export default Registro2;
