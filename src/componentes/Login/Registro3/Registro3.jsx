import { useState } from "react";
import "./Registro3.css";
import EncabezadoRegistro from "../EncabezadoRegistro";
import FilaArtistas from "../../perfil/filaArtistas";
import BuscarArtista from "../../perfil/buscarArtista";

const MAX_ARTISTAS = 20;

function Registro3({ datosIniciales = {}, onVolver, onSiguiente }) {
  const [artistasSeleccionados, setArtistasSeleccionados] = useState(
    datosIniciales.artistas || []
  );
  const [mostrarBuscadorArtistas, setMostrarBuscadorArtistas] = useState(false);

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

  return (
    <main className="regPantalla">
      <EncabezadoRegistro
        paso={3}
        onVolver={() => onVolver({ artistas: artistasSeleccionados })}
        onOmitir={() => onSiguiente({ artistas: [] })}
      />

      <section className="regContenido">
        <h1 className="regTitulo">Tus artistas favoritos</h1>
        <p className="regBajada">Con ellos te mostramos fans y conciertos parecidos a vos.</p>

        <div className="registro3Artistas">
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

        <div className="regPie">
          <button
            className="fmBotonPrimario regBotonSiguiente"
            type="button"
            onClick={() => onSiguiente({ artistas: artistasSeleccionados })}
          >
            Siguiente
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
