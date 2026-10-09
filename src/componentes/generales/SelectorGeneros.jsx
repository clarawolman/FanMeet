import { useEffect, useState } from "react";
import { usuariosService } from "../../services/usuariosService";
import { idDeGenero, nombreDeGenero } from "../../utils/generos";
import "./SelectorGeneros.css";

const ESPERA_MS = 300;

function mismaClave(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// Buscador de géneros sobre todo lo que existe (MusicBrainz + Last.fm),
// como el buscador de artistas de Spotify. Sin texto muestra los géneros
// que ya eligió gente de FanMeet. Lo usan el registro y "Editar géneros".
// `seleccionados` es una lista de { id, nombre }.
export default function SelectorGeneros({ seleccionados, onCambiar }) {
  const [populares, setPopulares] = useState([]);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const [agregando, setAgregando] = useState(null);

  const consulta = texto.trim();

  useEffect(() => {
    usuariosService
      .obtenerCatalogoGeneros()
      .then((catalogo) =>
        setPopulares((catalogo || []).map((g) => ({ id: idDeGenero(g), nombre: nombreDeGenero(g) })))
      )
      .catch((err) => console.error("Error cargando géneros:", err));
  }, []);

  useEffect(() => {
    if (!consulta) return;

    let cancelado = false;
    const temporizador = setTimeout(async () => {
      setBuscando(true);
      try {
        const datos = await usuariosService.buscarGeneros(consulta);
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

  function estaElegido(genero) {
    return seleccionados.some(
      (s) => (genero.id != null && String(s.id) === String(genero.id)) || mismaClave(s.nombre, genero.nombre)
    );
  }

  function quitar(genero) {
    onCambiar(seleccionados.filter((s) => !mismaClave(s.nombre, genero.nombre)));
  }

  async function alternar(genero) {
    if (estaElegido(genero)) {
      quitar(genero);
      return;
    }

    // Los que todavía no están en el catálogo se crean al elegirlos.
    let elegido = genero;
    if (genero.id == null) {
      setAgregando(genero.nombre);
      try {
        const creado = await usuariosService.agregarGeneroAlCatalogo(genero.nombre);
        elegido = { id: creado.id, nombre: creado.nombre };
      } catch (err) {
        setError(err.message);
        setAgregando(null);
        return;
      }
      setAgregando(null);
    }

    onCambiar([...seleccionados, elegido]);
    setTexto("");
  }

  // Con el input vacío no mostramos lo que quedó de la búsqueda anterior.
  const visibles = consulta ? resultados : populares.filter((g) => !estaElegido(g));
  const errorVisible = consulta ? error : "";

  return (
    <div className="selectorGeneros">
      {seleccionados.length > 0 && (
        <div className="selectorGenerosElegidos">
          {seleccionados.map((genero) => (
            <button
              key={genero.id ?? genero.nombre}
              type="button"
              className="selectorGenerosElegido"
              onClick={() => quitar(genero)}
              aria-label={`Quitar ${genero.nombre}`}
            >
              {genero.nombre}
              <span aria-hidden="true">✕</span>
            </button>
          ))}
        </div>
      )}

      <div className="selectorGenerosBuscador">
        <span className="selectorGenerosBuscadorIcono" aria-hidden="true">
          ⌕
        </span>
        <input
          type="search"
          placeholder="Buscá cualquier género: cumbia, trap, shoegaze…"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            // Evita que "No encontramos…" parpadee durante la espera.
            setBuscando(true);
          }}
        />
      </div>

      {!consulta && visibles.length > 0 && (
        <p className="selectorGenerosTitulo">Elegidos por otros fans</p>
      )}

      {errorVisible && <p className="selectorGenerosMensaje">{errorVisible}</p>}

      {!errorVisible && consulta && buscando && resultados.length === 0 && (
        <p className="selectorGenerosMensaje">Buscando…</p>
      )}

      {!errorVisible && consulta && !buscando && resultados.length === 0 && (
        <p className="selectorGenerosMensaje">No encontramos ese género.</p>
      )}

      <div className="selectorGenerosOpciones">
        {visibles.map((genero) => {
          const activo = estaElegido(genero);

          return (
            <button
              key={genero.id ?? genero.nombre}
              type="button"
              className={`fmChipGenero selectorGenerosOpcion ${activo ? "activo" : ""}`}
              disabled={agregando === genero.nombre}
              onClick={() => alternar(genero)}
            >
              <strong>{agregando === genero.nombre ? "…" : genero.nombre}</strong>
              {activo && <span aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>

      {consulta && <p className="selectorGenerosFuente">Géneros de MusicBrainz y Last.fm</p>}
    </div>
  );
}
