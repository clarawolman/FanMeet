import { useContext, useEffect, useState } from "react";
import "./EditarGeneros.css";
import { usuariosService } from "../../services/usuariosService";
import { idDeGenero, nombreDeGenero } from "../../utils/generos";
import { UsuarioContext } from "../../context/UsuarioContext";
import SelectorGeneros from "../generales/SelectorGeneros";

function EditarGeneros({ onVolver }) {
  const { usuarioActual } = useContext(UsuarioContext);
  const [seleccionados, setSeleccionados] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!usuarioActual?.id_usuario) return;
    let cancelado = false;

    Promise.all([usuariosService.obtenerCatalogoGeneros(), usuariosService.obtenerMisGeneros()])
      .then(([catalogo, idsSeleccionados]) => {
        if (cancelado) return;
        const elegidos = (idsSeleccionados || [])
          .map((id) => (catalogo || []).find((g) => String(idDeGenero(g)) === String(id)))
          .filter(Boolean)
          .map((g) => ({ id: idDeGenero(g), nombre: nombreDeGenero(g) }));
        setSeleccionados(elegidos);
      })
      .catch((error) => {
        console.error("Error cargando géneros del usuario:", error);
        if (!cancelado) setSeleccionados([]);
      })
      .finally(() => !cancelado && setCargando(false));

    return () => {
      cancelado = true;
    };
  }, [usuarioActual?.id_usuario]);

  async function manejarGuardar() {
    if (seleccionados.length < 2) {
      setError("Elegí al menos 2 géneros musicales");
      return;
    }

    setGuardando(true);

    try {
      await usuariosService.guardarMisGeneros(seleccionados.map((g) => g.id));
      setGuardando(false);
      onVolver();
    } catch (error) {
      setError("No se pudieron guardar los géneros: " + error.message);
      setGuardando(false);
    }
  }

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

        {!cargando && (
          <>
            <p className="editarGenerosSubtitulo">
              Elegí al menos 2 géneros favoritos para tu perfil
            </p>

            <SelectorGeneros
              seleccionados={seleccionados}
              onCambiar={(lista) => {
                setError("");
                setSeleccionados(lista);
              }}
            />

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
