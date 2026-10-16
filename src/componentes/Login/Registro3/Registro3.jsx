import { useState } from "react";
import "./Registro3.css";
import EncabezadoRegistro from "../EncabezadoRegistro";
import { IconoPogo, IconoSentado, IconoPrimeraFila } from "../../perfil/vibraIconos";
import SelectorGeneros from "../../generales/SelectorGeneros";
import FilaArtistas from "../../perfil/filaArtistas";
import BuscarArtista from "../../perfil/buscarArtista";

const MAX_ARTISTAS = 20;

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

function Registro3({ datosIniciales = {}, onVolver, onFinalizar }) {
  const [generosSeleccionados, setGenerosSeleccionados] = useState(
    datosIniciales.generos || []
  );
  const [ambienteSeleccionado, setAmbienteSeleccionado] = useState(
    datosIniciales.estilo_asistencia || ""
  );
  const [artistasSeleccionados, setArtistasSeleccionados] = useState(
    datosIniciales.artistas || []
  );
  const [mostrarBuscadorArtistas, setMostrarBuscadorArtistas] = useState(false);
  const [errorRegistro3, setErrorRegistro3] = useState("");

  // La cuenta todavía no existe: se guardan acá y App.jsx los suma como
  // favoritos apenas termina el registro (igual que la foto de perfil).
  async function agregarArtista(artista) {
    setArtistasSeleccionados((actuales) =>
      actuales.some((a) => a.spotify_id === artista.spotify_id) ? actuales : [...actuales, artista]
    );
  }

  function quitarArtista(artista) {
    setArtistasSeleccionados((actuales) =>
      actuales.filter((a) => a.spotify_id !== artista.spotify_id)
    );
  }

  function manejarVolver() {
    onVolver({
      generos: generosSeleccionados,
      artistas: artistasSeleccionados,
      estilo_asistencia: ambienteSeleccionado,
    });
  }

  function manejarFinalizar() {
    if (generosSeleccionados.length < 2) {
      setErrorRegistro3("Elegí al menos 2 géneros para seguir.");
      return;
    }

    if (!ambienteSeleccionado) {
      setErrorRegistro3("Contanos cómo vivís un recital: elegí una opción.");
      return;
    }

    setErrorRegistro3("");

    onFinalizar({
      estilos_musicales: generosSeleccionados.map((genero) => genero.id),
      artistas_favoritos: artistasSeleccionados.map((artista) => artista.spotify_id),
      estilo_asistencia: ambienteSeleccionado,
    });
  }

  return (
    <main className="regPantalla regPantallaAncha">
      <EncabezadoRegistro paso={3} onVolver={manejarVolver} />

      <section className="registro3Contenido">
        <div className="registro3Columna">
          <h1 className="regTitulo">¿Qué escuchás?</h1>
          <p className="regBajada">Elegí al menos 2 géneros. Con eso armamos tus recomendaciones y tus matches.</p>

          <div className="registro3Selector">
            <SelectorGeneros
              seleccionados={generosSeleccionados}
              maxPopulares={5}
              onCambiar={(lista) => {
                setErrorRegistro3("");
                setGenerosSeleccionados(lista);
              }}
            />
          </div>

          <div className="registro3Artistas">
            <h2 className="registro3SeccionTitulo">Tus artistas favoritos</h2>
            <p className="registro3SeccionBajada">Opcional. Con ellos te mostramos fans y conciertos parecidos a vos.</p>

            <FilaArtistas
              artistas={artistasSeleccionados}
              onQuitar={quitarArtista}
              alInicio={
                artistasSeleccionados.length < MAX_ARTISTAS && (
                  <button
                    className="artistaAgregar"
                    type="button"
                    onClick={() => setMostrarBuscadorArtistas(true)}
                  >
                    <span className="artistaAgregarCirculo" aria-hidden="true">
                      +
                    </span>
                    <strong>Agregar</strong>
                    <small>
                      {artistasSeleccionados.length > 0 ? "Sumá otro artista" : "Tu primer artista"}
                    </small>
                  </button>
                )
              }
            />
          </div>
        </div>

        <fieldset className="registro3Columna registro3Ambientes">
          <legend className="registro3SeccionTitulo">¿Cómo vivís un recital?</legend>

          {ambientes.map((ambiente) => {
            const activo = ambienteSeleccionado === ambiente.id;

            return (
              <button
                key={ambiente.id}
                className={`registro3Ambiente ${activo ? "activo" : ""}`}
                type="button"
                aria-pressed={activo}
                onClick={() => {
                  setErrorRegistro3("");
                  setAmbienteSeleccionado(ambiente.id);
                }}
              >
                <span className="registro3AmbienteIcono" aria-hidden="true">
                  {ambiente.icono}
                </span>

                <span className="registro3AmbienteTexto">
                  <strong>{ambiente.titulo}</strong>
                  <small>{ambiente.descripcion}</small>
                </span>

                <span className="registro3Check" aria-hidden="true">
                  {activo && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </fieldset>

        <div className="registro3Pie">
          {errorRegistro3 && (
            <p className="fmAvisoError regError" role="alert">
              {errorRegistro3}
            </p>
          )}

          <button className="fmBotonPrimario regBotonSiguiente" type="button" onClick={manejarFinalizar}>
            Crear mi cuenta
          </button>
        </div>
      </section>

      {mostrarBuscadorArtistas && (
        <BuscarArtista
          favoritos={artistasSeleccionados}
          onAgregar={agregarArtista}
          onCerrar={() => setMostrarBuscadorArtistas(false)}
        />
      )}
    </main>
  );
}

export default Registro3;
