import { useState } from "react";
import "./Registro3.css";

const generosMusicales = [
  { id: "rock", nombre: "Rock", icono: "⚡" },
  { id: "pop", nombre: "Pop", icono: "♪" },
  { id: "techno", nombre: "Techno", icono: "▥" },
  { id: "indie", nombre: "Indie", icono: "▤" },
  { id: "hiphop", nombre: "Hip Hop", icono: "🎧" },
  { id: "jazz", nombre: "Jazz", icono: "♨" },
  { id: "otros", nombre: "Otros", icono: "⊕" },
];

const ambientes = [
  {
    id: "pogo",
    titulo: "Pogos, campos",
    descripcion: "Mucha energía, sudor y movimiento.",
    icono: "♟",
  },
  {
    id: "tranquilo",
    titulo: "Tranquilo",
    descripcion: "Relajado desde atrás con una bebida.",
    icono: "▣",
  },
  {
    id: "campo",
    titulo: "Primera Fila",
    descripcion: "Ojos en el escenario, cantando cada palabra.",
    icono: "◉",
  },
];

function Registro3({ onVolver, onFinalizar }) {
  const [generosSeleccionados, setGenerosSeleccionados] = useState([]);
  const [ambienteSeleccionado, setAmbienteSeleccionado] = useState("");
  const [errorRegistro3, setErrorRegistro3] = useState("");

  function manejarGenero(idGenero) {
    setErrorRegistro3("");

    if (generosSeleccionados.includes(idGenero)) {
      setGenerosSeleccionados(
        generosSeleccionados.filter((genero) => genero !== idGenero)
      );
      return;
    }

    if (generosSeleccionados.length >= 2) {
      setErrorRegistro3("Solo podés elegir 2 géneros musicales");
      return;
    }

    setGenerosSeleccionados([...generosSeleccionados, idGenero]);
  }

  function manejarFinalizar() {
    if (generosSeleccionados.length !== 2) {
      setErrorRegistro3("Elegí exactamente 2 géneros musicales");
      return;
    }

    if (!ambienteSeleccionado) {
      setErrorRegistro3("Elegí 1 ambiente de concierto");
      return;
    }

    setErrorRegistro3("");

    onFinalizar({
      generos: generosSeleccionados,
      estilo_asistencia: ambienteSeleccionado,
    });
  }

  return (
    <main className="pantallaRegistro3">
      <header className="registro3Header">
        <button className="registro3Volver" type="button" onClick={onVolver}>
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
          Elige tus géneros favoritos para encontrar a tu grupo
        </p>

        <div className="registro3Generos">
          {generosMusicales.map((genero) => {
            const activo = generosSeleccionados.includes(genero.id);

            return (
              <button
                key={genero.id}
                className={`registro3Genero ${activo ? "activo" : ""}`}
                type="button"
                onClick={() => manejarGenero(genero.id)}
              >
                <span>{genero.icono}</span>
                <strong>{genero.nombre}</strong>
              </button>
            );
          })}
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

                <span className="registro3Check">
                  {activo ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {errorRegistro3 && (
          <p className="registro3Error">{errorRegistro3}</p>
        )}

        <div className="registro3Decoracion">▏▌▏</div>

        <button
          className="registro3BotonFinalizar"
          type="button"
          onClick={manejarFinalizar}
        >
          Finalizar
        </button>
      </section>
    </main>
  );
}

export default Registro3;