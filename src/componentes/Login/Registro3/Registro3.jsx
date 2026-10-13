import { useState } from "react";
import "./Registro3.css";
import SelectorGeneros from "../../generales/SelectorGeneros";
import FilaArtistas from "../../perfil/filaArtistas";
import BuscarArtista from "../../perfil/buscarArtista";

const MAX_ARTISTAS = 20;

const ambientes = [
  {
    id: "pogo",
    titulo: "Pogos, campos",
    descripcion: "Mucha energía, sudor y movimiento.",
    icono: "♟",
  },
  {
    id: "tranquilo",
    titulo: "Platea",
    descripcion: "Sentado y relajado con una bebida.",
    icono: "▣",
  },
  {
    id: "campo",
    titulo: "Primera Fila",
    descripcion: "Ojos en el escenario, cantando cada palabra.",
    icono: "◉",
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
      setErrorRegistro3("Elegí al menos 2 géneros musicales");
      return;
    }

    if (!ambienteSeleccionado) {
      setErrorRegistro3("Elegí 1 ambiente de concierto");
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
    <main className="pantallaRegistro3">
      <header className="registro3Header">
        <button className="registro3Volver" type="button" onClick={manejarVolver}>
          ←
        </button>

        <h1 className="registro3Logo">FanMeet</h1>
      </header>

      <section className="registro3Contenido">
        <div className="registro3ProgresoInfo">
          <span>PASO 3 DE 3</span>
          <span>100%</span>
        </div>

        <div className="registro3Barra">
          <div className="registro3BarraActiva"></div>
        </div>

        <h2 className="registro3Titulo">Tu Estilo Musical</h2>

        <p className="registro3Subtitulo">
          Elegí al menos 2 géneros favoritos para encontrar a tu grupo
        </p>

        <div className="registro3Selector">
          <SelectorGeneros
            seleccionados={generosSeleccionados}
            onCambiar={(lista) => {
              setErrorRegistro3("");
              setGenerosSeleccionados(lista);
            }}
          />
        </div>

        <div className="registro3Artistas">
          <h3 className="registro3ArtistasTitulo">Tus artistas favoritos</h3>
          <p className="registro3ArtistasSubtitulo">
            Opcional: con ellos te mostramos fans y conciertos parecidos a vos
          </p>

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

        <h3 className="registro3SeccionTitulo">♚ Ambiente de Concierto</h3>

        <div className="registro3Ambientes">
          {ambientes.map((ambiente) => {
            const activo = ambienteSeleccionado === ambiente.id;

            return (
              <button
                key={ambiente.id}
                className={`registro3Ambiente ${activo ? "activo" : ""}`}
                type="button"
                onClick={() => {
                  setErrorRegistro3("");
                  setAmbienteSeleccionado(ambiente.id);
                }}
              >
                <span className="registro3AmbienteIcono">{ambiente.icono}</span>

                <span className="registro3AmbienteTexto">
                  <strong>{ambiente.titulo}</strong>
                  <small>{ambiente.descripcion}</small>
                </span>

                <span className="registro3Check">{activo ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>

        {errorRegistro3 && <p className="registro3Error">{errorRegistro3}</p>}

        <button
          className="registro3BotonFinalizar"
          type="button"
          onClick={manejarFinalizar}
        >
          Finalizar
        </button>
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
