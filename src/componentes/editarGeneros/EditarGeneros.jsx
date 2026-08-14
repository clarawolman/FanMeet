import { useEffect, useState } from "react";
import "./EditarGeneros.css";
import { usuariosService } from "../../services/usuariosService";
import { idDeGenero, nombreDeGenero } from "../../utils/generos";

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

    try {
      const catalogoData = await usuariosService.obtenerCatalogoGeneros();
      setCatalogoError("");
      setCatalogo(catalogoData || []);
    } catch (error) {
      console.error("Error cargando catálogo de géneros:", error);
      setCatalogoError(error.message);
      setCatalogo([]);
    }

    try {
      const idsSeleccionados = await usuariosService.obtenerMisGeneros();
      setSeleccionados(idsSeleccionados || []);
    } catch (error) {
      console.error("Error cargando géneros del usuario:", error);
      setSeleccionados([]);
    }

    setCargando(false);
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

    try {
      await usuariosService.guardarMisGeneros(seleccionados);
      setGuardando(false);
      onVolver();
    } catch (error) {
      setError("No se pudieron guardar los géneros: " + error.message);
      setGuardando(false);
    }
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
