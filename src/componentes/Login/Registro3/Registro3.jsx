import { useEffect, useState } from "react";
import "./Registro3.css";
import { supabase } from "../../../supabase";
import { idDeGenero, nombreDeGenero } from "../../../utils/generos";

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
  const [catalogoGeneros, setCatalogoGeneros] = useState([]);
  const [catalogoError, setCatalogoError] = useState("");
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);

  const [generosSeleccionados, setGenerosSeleccionados] = useState(
    datosIniciales.generos || []
  );
  const [ambienteSeleccionado, setAmbienteSeleccionado] = useState(
    datosIniciales.estilo_asistencia || ""
  );
  const [errorRegistro3, setErrorRegistro3] = useState("");

  useEffect(() => {
    cargarCatalogoGeneros();
  }, []);

  async function cargarCatalogoGeneros() {
    setCargandoCatalogo(true);

    const { data, error } = await supabase.from("estilo_musical").select("*");

    if (error) {
      console.error("Error cargando catálogo de géneros:", error);
      setCatalogoError(error.message);
      setCatalogoGeneros([]);
    } else {
      setCatalogoError("");
      setCatalogoGeneros(data || []);
    }

    setCargandoCatalogo(false);
  }

  function manejarGenero(idGenero) {
    setErrorRegistro3("");

    if (generosSeleccionados.includes(idGenero)) {
      setGenerosSeleccionados(
        generosSeleccionados.filter((genero) => genero !== idGenero)
      );
      return;
    }

    setGenerosSeleccionados([...generosSeleccionados, idGenero]);
  }

  function manejarVolver() {
    onVolver({
      generos: generosSeleccionados,
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
      estilos_musicales: generosSeleccionados,
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

        {cargandoCatalogo && (
          <p className="registro3Subtitulo">Cargando géneros...</p>
        )}

        {!cargandoCatalogo && catalogoError && (
          <p className="registro3Error">
            No pudimos cargar el catálogo de géneros ({catalogoError}).
          </p>
        )}

        {!cargandoCatalogo && !catalogoError && (
          <div className="registro3Generos">
            {catalogoGeneros.map((genero) => {
              const idGenero = idDeGenero(genero);
              const activo = generosSeleccionados.includes(idGenero);

              return (
                <button
                  key={idGenero}
                  className={`registro3Genero ${activo ? "activo" : ""}`}
                  type="button"
                  onClick={() => manejarGenero(idGenero)}
                >
                  <span>♪</span>
                  <strong>{nombreDeGenero(genero)}</strong>
                </button>
              );
            })}
          </div>
        )}

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
    </main>
  );
}

export default Registro3;
