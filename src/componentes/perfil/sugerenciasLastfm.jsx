import { useEffect, useRef, useState } from "react";
import { lastfmService } from "../../services/lastfmService";
import { spotifyService } from "../../services/spotifyService";
import { usuariosService } from "../../services/usuariosService";
import "./sugerenciasLastfm.css";

function alternar(conjunto, valor) {
  const nuevo = new Set(conjunto);
  if (nuevo.has(valor)) nuevo.delete(valor);
  else nuevo.add(valor);
  return nuevo;
}

// Se muestra justo después de vincular Last.fm: ofrece sumar al perfil sus
// artistas más escuchados (como favoritos) y los géneros que se deducen.
// Todo viene preseleccionado; se puede destildar lo que no quiera.
export default function SugerenciasLastfm({ onListo }) {
  const [sugerencias, setSugerencias] = useState(null);
  const [artistasElegidos, setArtistasElegidos] = useState(new Set());
  const [generosElegidos, setGenerosElegidos] = useState(new Set());
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");
  // Las sugerencias se piden una sola vez aunque el padre cambie onListo.
  const onListoRef = useRef(onListo);

  useEffect(() => {
    onListoRef.current = onListo;
  });

  useEffect(() => {
    let cancelado = false;

    lastfmService
      .obtenerSugerencias()
      .then((datos) => {
        if (cancelado) return;
        setSugerencias(datos);
        setArtistasElegidos(new Set(datos.artistas.map((a) => a.spotify_id)));
        setGenerosElegidos(new Set(datos.generos.map((g) => g.nombre)));
      })
      .catch((error) => {
        console.error("Error cargando sugerencias de Last.fm:", error);
        if (!cancelado) onListoRef.current(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  async function agregar() {
    setGuardando(true);
    let fallos = 0;

    // En orden, para que el carrusel quede como lo que más escucha.
    for (const artista of sugerencias.artistas) {
      if (!artistasElegidos.has(artista.spotify_id)) continue;
      try {
        await spotifyService.agregarFavorito(artista.spotify_id);
      } catch (error) {
        console.error("No se pudo sumar el artista:", error);
        fallos += 1;
      }
    }

    const idsNuevos = [];
    for (const genero of sugerencias.generos) {
      if (!generosElegidos.has(genero.nombre)) continue;
      try {
        const enCatalogo = genero.id ?? (await usuariosService.agregarGeneroAlCatalogo(genero.nombre)).id;
        idsNuevos.push(enCatalogo);
      } catch (error) {
        console.error("No se pudo sumar el género:", error);
        fallos += 1;
      }
    }

    if (idsNuevos.length > 0) {
      try {
        const actuales = (await usuariosService.obtenerMisGeneros()) || [];
        const todos = [...new Set([...actuales, ...idsNuevos].map(String))];
        await usuariosService.guardarMisGeneros(todos);
      } catch (error) {
        console.error("No se pudieron guardar los géneros:", error);
        fallos += idsNuevos.length;
      }
    }

    setGuardando(false);
    if (fallos > 0) {
      setAviso("Algunas cosas no se pudieron sumar. Podés agregarlas a mano desde tu perfil.");
      return;
    }
    onListo(true);
  }

  if (!sugerencias) {
    return <p className="sugerenciasLastfmCargando">Buscando lo que escuchás…</p>;
  }

  const { artistas, generos } = sugerencias;
  if (artistas.length === 0 && generos.length === 0) return null;

  const nadaElegido = artistasElegidos.size === 0 && generosElegidos.size === 0;

  return (
    <div className="sugerenciasLastfm">
      <h4>¿Sumamos esto a tu perfil?</h4>
      <p className="sugerenciasLastfmSubtitulo">
        Lo sacamos de lo que escuchás en Last.fm. Tocá para sacar lo que no quieras.
      </p>

      {artistas.length > 0 && (
        <>
          <h5>Artistas favoritos</h5>
          <div className="sugerenciasLastfmOpciones">
            {artistas.map((artista) => {
              const activo = artistasElegidos.has(artista.spotify_id);
              return (
                <button
                  key={artista.spotify_id}
                  type="button"
                  className={`sugerenciasLastfmArtista ${activo ? "activo" : ""}`}
                  aria-pressed={activo}
                  onClick={() => setArtistasElegidos((c) => alternar(c, artista.spotify_id))}
                >
                  {artista.imagen ? (
                    <img src={artista.imagen} alt="" />
                  ) : (
                    <span className="sugerenciasLastfmInicial" aria-hidden="true">
                      {artista.nombre[0]?.toUpperCase()}
                    </span>
                  )}
                  {artista.nombre}
                  <span aria-hidden="true">{activo ? "✓" : "+"}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {generos.length > 0 && (
        <>
          <h5>Géneros</h5>
          <div className="sugerenciasLastfmOpciones">
            {generos.map((genero) => {
              const activo = generosElegidos.has(genero.nombre);
              return (
                <button
                  key={genero.nombre}
                  type="button"
                  className={`fmChipGenero sugerenciasLastfmGenero ${activo ? "activo" : ""}`}
                  aria-pressed={activo}
                  onClick={() => setGenerosElegidos((c) => alternar(c, genero.nombre))}
                >
                  <strong>{genero.nombre}</strong>
                  <span aria-hidden="true">{activo ? "✓" : "+"}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {aviso && <p className="sugerenciasLastfmAviso">{aviso}</p>}

      <div className="sugerenciasLastfmBotones">
        {aviso ? (
          <button type="button" className="sugerenciasLastfmAgregar" onClick={() => onListo(true)}>
            Listo
          </button>
        ) : (
          <>
            <button
              type="button"
              className="sugerenciasLastfmOmitir"
              onClick={() => onListo(false)}
              disabled={guardando}
            >
              Ahora no
            </button>
            <button
              type="button"
              className="sugerenciasLastfmAgregar"
              onClick={agregar}
              disabled={guardando || nadaElegido}
            >
              {guardando ? "Agregando…" : "Agregar a mi perfil"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
