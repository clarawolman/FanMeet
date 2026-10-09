import { useEffect, useState } from "react";
import { spotifyService } from "../../services/spotifyService";
import IconoSpotify from "./iconoSpotify";
import "./buscarArtista.css";

const ESPERA_MS = 300;

// Busca en todo el catálogo de Spotify (vía backend) para sumar artistas
// al carrusel de favoritos del perfil.
export default function BuscarArtista({ favoritos, onAgregar, onCerrar }) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const [agregando, setAgregando] = useState(null);

  const consulta = texto.trim();

  useEffect(() => {
    if (!consulta) return;

    let cancelado = false;
    const temporizador = setTimeout(async () => {
      setBuscando(true);
      try {
        const datos = await spotifyService.buscar(consulta, "artista");
        if (!cancelado) {
          setResultados(datos || []);
          setError("");
        }
      } catch (err) {
        if (!cancelado) setError(err.message);
      }
      if (!cancelado) setBuscando(false);
    }, ESPERA_MS);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [consulta]);

  useEffect(() => {
    function manejarTecla(e) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [onCerrar]);

  async function agregar(artista) {
    setAgregando(artista.spotify_id);
    try {
      await onAgregar(artista);
    } catch (err) {
      alert("No se pudo agregar el artista: " + err.message);
    }
    setAgregando(null);
  }

  // Con el input vacío no mostramos lo que quedó de la búsqueda anterior.
  const visibles = consulta ? resultados : [];
  const errorVisible = consulta ? error : "";
  const idsFavoritos = new Set(favoritos.map((a) => a.spotify_id));

  return (
    <div className="buscarArtistaOverlay" role="dialog" aria-modal="true" onClick={onCerrar}>
      <div className="buscarArtistaPanel" onClick={(e) => e.stopPropagation()}>
        <div className="buscarArtistaHeader">
          <h3>Sumar artistas</h3>
          <button
            className="buscarArtistaCerrar"
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <input
          className="buscarArtistaInput"
          type="search"
          placeholder="Buscá cualquier artista…"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            // Evita que "No encontramos…" parpadee durante la espera.
            setBuscando(true);
          }}
          autoFocus
        />

        <div className="buscarArtistaResultados">
          {errorVisible && <p className="buscarArtistaMensaje">{errorVisible}</p>}

          {!errorVisible && consulta && buscando && visibles.length === 0 && (
            <p className="buscarArtistaMensaje">Buscando…</p>
          )}

          {!errorVisible && consulta && !buscando && visibles.length === 0 && (
            <p className="buscarArtistaMensaje">No encontramos artistas con ese nombre.</p>
          )}

          {visibles.map((artista) => {
            const yaEsta = idsFavoritos.has(artista.spotify_id);

            return (
              <div className="buscarArtistaFila" key={artista.spotify_id}>
                {artista.imagen ? (
                  <img className="buscarArtistaImagen" src={artista.imagen} alt="" />
                ) : (
                  <span className="buscarArtistaImagen" aria-hidden="true" />
                )}

                <span className="buscarArtistaNombre">{artista.nombre}</span>

                <button
                  className={`buscarArtistaBoton ${yaEsta ? "agregado" : ""}`}
                  type="button"
                  disabled={yaEsta || agregando === artista.spotify_id}
                  onClick={() => agregar(artista)}
                >
                  {yaEsta ? "Agregado" : agregando === artista.spotify_id ? "…" : "Agregar"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="buscarArtistaFuente">
          <IconoSpotify size={14} /> Resultados de Spotify
        </p>
      </div>
    </div>
  );
}
