import { useEffect, useState } from "react";
import { spotifyService } from "../../services/spotifyService";
import FilaArtistas from "./filaArtistas";
import BuscarArtista from "./buscarArtista";
import "./artistasFavoritosPerfil.css";

const MAX_FAVORITOS = 20;

export default function ArtistasFavoritosPerfil({ idUsuario, isOwnProfile }) {
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mostrarBuscador, setMostrarBuscador] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      try {
        const datos = await spotifyService.listarFavoritos(idUsuario);
        if (!cancelado) {
          setFavoritos(datos || []);
          setError("");
        }
      } catch (err) {
        console.error("Error cargando artistas favoritos:", err);
        if (!cancelado) setError(err.message);
      }
      if (!cancelado) setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [idUsuario]);

  async function manejarAgregar(artista) {
    const agregado = await spotifyService.agregarFavorito(artista.spotify_id);
    setFavoritos((actuales) =>
      actuales.some((a) => a.spotify_id === agregado.spotify_id)
        ? actuales
        : [...actuales, agregado]
    );
  }

  async function manejarQuitar(artista) {
    const anteriores = favoritos;
    setFavoritos((actuales) => actuales.filter((a) => a.spotify_id !== artista.spotify_id));

    try {
      await spotifyService.quitarFavorito(artista.spotify_id);
    } catch (err) {
      setFavoritos(anteriores);
      alert("No se pudo quitar el artista: " + err.message);
    }
  }

  const hayFavoritos = favoritos.length > 0;
  const puedeAgregar = isOwnProfile && favoritos.length < MAX_FAVORITOS;

  // En un perfil ajeno sin favoritos no tiene sentido mostrar la sección.
  if (!isOwnProfile && !cargando && !hayFavoritos && !error) return null;

  return (
    <section className="artistasFavoritosPerfil">
      <div className="artistasFavoritosHeader">
        <h3>Artistas favoritos</h3>
      </div>

      {error && <p className="artistasFavoritosVacio">No pudimos cargar los artistas ({error}).</p>}

      {!error && !cargando && (hayFavoritos || isOwnProfile) && (
        <FilaArtistas
          artistas={favoritos}
          onQuitar={isOwnProfile ? manejarQuitar : undefined}
          alInicio={
            puedeAgregar && (
              <button
                className="artistaAgregar"
                type="button"
                onClick={() => setMostrarBuscador(true)}
              >
                <span className="artistaAgregarCirculo" aria-hidden="true">
                  +
                </span>
                <strong>Agregar</strong>
                <small>{hayFavoritos ? "Sumá otro artista" : "Tu primer artista"}</small>
              </button>
            )
          }
        />
      )}

      {mostrarBuscador && (
        <BuscarArtista
          favoritos={favoritos}
          onAgregar={manejarAgregar}
          onCerrar={() => setMostrarBuscador(false)}
        />
      )}
    </section>
  );
}
