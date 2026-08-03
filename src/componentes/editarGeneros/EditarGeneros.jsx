import { useEffect, useState } from "react";
import "./EditarGeneros.css";
import { supabase } from "../../supabase";

function EditarGeneros({ usuarioActual, onVolver }) {
  const [catalogo, setCatalogo] = useState([]);
  const [catalogoError, setCatalogoError] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (usuarioActual?.id_usuario) {
      cargarDatos();
    }
  }, [usuarioActual]);

  async function cargarDatos() {
    setCargando(true);

    const [{ data: catalogoData, error: errorCatalogo }, { data: seleccionData, error: errorSeleccion }] =
      await Promise.all([
        supabase.from("estilo_musical").select("*"),
        supabase
          .from("estilo_musical_usuario")
          .select("id_estilo")
          .eq("id_usuario", usuarioActual.id_usuario),
      ]);

    if (errorCatalogo) {
      console.error("Error cargando catálogo de géneros:", errorCatalogo);
      setCatalogoError(errorCatalogo.message);
      setCatalogo([]);
    } else {
      setCatalogoError("");
      setCatalogo(catalogoData || []);
    }

    if (errorSeleccion) {
      console.error("Error cargando géneros del usuario:", errorSeleccion);
      setSeleccionados([]);
    } else {
      setSeleccionados((seleccionData || []).map((fila) => fila.id_estilo));
    }

    setCargando(false);
  }

  function idDeGenero(genero) {
    return genero.id_estilo ?? genero.id ?? genero.id_estilo_musical;
  }

  function nombreDeGenero(genero) {
    return genero.nombre ?? genero.nombre_estilo ?? genero.genero ?? "Género";
  }

  function manejarGenero(idGenero) {
    setError("");

    if (seleccionados.includes(idGenero)) {
      setSeleccionados(seleccionados.filter((id) => id !== idGenero));
      return;
    }

    setSeleccionados([...seleccionados, idGenero]);
  }

  async function manejarGuardar() {
    if (seleccionados.length < 2) {
      setError("Elegí al menos 2 géneros musicales");
      return;
    }

    setGuardando(true);

    const { error: errorBorrado } = await supabase
      .from("estilo_musical_usuario")
      .delete()
      .eq("id_usuario", usuarioActual.id_usuario);

    if (errorBorrado) {
      setError("No se pudieron guardar los géneros: " + errorBorrado.message);
      setGuardando(false);
      return;
    }

    const { error: errorInsercion } = await supabase
      .from("estilo_musical_usuario")
      .insert(
        seleccionados.map((idEstilo) => ({
          id_usuario: usuarioActual.id_usuario,
          id_estilo: idEstilo,
        }))
      );

    if (errorInsercion) {
      setError("No se pudieron guardar los géneros: " + errorInsercion.message);
      setGuardando(false);
      return;
    }

    setGuardando(false);
    onVolver();
  }

  const catalogoFiltrado = catalogo.filter((genero) =>
    nombreDeGenero(genero).toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  return (
    <main className="pantallaEditarGeneros">
      <header className="editarGenerosHeader">
        <button className="editarGenerosVolver" type="button" onClick={onVolver}>
          ←
        </button>

        <h1 className="editarGenerosLogo">FanMeet</h1>
      </header>

      <section className="editarGenerosContenido">
        <h2 className="editarGenerosTitulo">Tu Estilo Musical</h2>

        {cargando && <p className="editarGenerosVacio">Cargando géneros...</p>}

        {!cargando && catalogoError && (
          <p className="editarGenerosError">
            No pudimos cargar el catálogo de géneros ({catalogoError}). Pedile a
            un administrador que ejecute:
            <br />
            <code>GRANT SELECT ON public.estilo_musical TO anon;</code>
          </p>
        )}

        {!cargando && !catalogoError && (
          <>
            <p className="editarGenerosSubtitulo">
              Elegí al menos 2 géneros favoritos para tu perfil
            </p>

            <div className="editarGenerosBuscador">
              <span className="editarGenerosBuscadorIcono">⌕</span>

              <input
                type="text"
                placeholder="Buscar género..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="editarGenerosGrid">
              {catalogoFiltrado.map((genero) => {
                const idGenero = idDeGenero(genero);
                const activo = seleccionados.includes(idGenero);

                return (
                  <button
                    key={idGenero}
                    className={`editarGenerosChip ${activo ? "activo" : ""}`}
                    type="button"
                    onClick={() => manejarGenero(idGenero)}
                  >
                    <strong>{nombreDeGenero(genero)}</strong>
                  </button>
                );
              })}
            </div>

            {catalogoFiltrado.length === 0 && (
              <p className="editarGenerosVacio">No encontramos ese género.</p>
            )}

            {error && <p className="editarGenerosError">{error}</p>}

            <div className="editarGenerosBotones">
              <button
                className="editarGenerosBotonCancelar"
                type="button"
                onClick={onVolver}
              >
                Cancelar
              </button>

              <button
                className="editarGenerosBotonGuardar"
                type="button"
                onClick={manejarGuardar}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default EditarGeneros;
