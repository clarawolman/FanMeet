import { useEffect, useState } from "react";
import "./Home.css";
import { supabase } from "../../supabase";
import Footer from "../generales/Footer";

function Home({ usuarioActual, onEntrarConcierto, onNavegar }) {
  const [conciertos, setConciertos] = useState([]);
  const [conciertoSeleccionado, setConciertoSeleccionado] = useState(null);
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [errorCodigo, setErrorCodigo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const CODIGO_PRUEBA = "FANMEET2026";

  const generos = [
    { id: "1", nombre: "Pop"},
    { id: "2", nombre: "Rock"},
    { id: "3", nombre: "Urbano"},
    { id: "4", nombre: "Indie"},
  ];

  useEffect(() => {
    cargarConciertos();
  }, []);

  async function cargarConciertos() {
    setCargando(true);

    const { data, error } = await supabase
      .from("concierto")
      .select(`
        *,
        artista (*),
        estadio (*)
      `);

    if (error) {
      console.error("Error cargando conciertos:", error);
      setConciertos([]);
      setCargando(false);
      return;
    }

    setConciertos(data || []);
    setCargando(false);
  }
  

  const conciertosBuscados = conciertos.filter((concierto) => {
    const texto = busqueda.toLowerCase();

    const nombreConcierto = concierto.nombre || "";
    const nombreArtista = concierto.artista?.nombre || "";
    const nombreEstadio = concierto.estadio?.nombre || "";
    const ciudadEstadio = concierto.estadio?.ciudad || "";

    return (
      nombreConcierto.toLowerCase().includes(texto) ||
      nombreArtista.toLowerCase().includes(texto) ||
      nombreEstadio.toLowerCase().includes(texto) ||
      ciudadEstadio.toLowerCase().includes(texto)
    );
  });

  const hayBusqueda = busqueda.trim().length > 0;

  function obtenerConciertosPorGenero(idGenero) {
    return conciertos.filter(
      (concierto) => String(concierto.id_estiloMusical) === String(idGenero)
    );
  }

  async function abrirOverlay(concierto) {
    setErrorCodigo("");

    const { data, error } = await supabase
      .from("usuarios_conciertos")
      .select("*")
      .eq("id_usuario", usuarioActual.id_usuario)
      .eq("id_concierto", concierto.id_concierto)
      .maybeSingle();

    if (error) {
      console.error("Error verificando acceso:", error);
      return;
    }

    if (data) {
      await onEntrarConcierto(concierto.id_concierto);
      return;
    }

    setConciertoSeleccionado(concierto);
    setCodigoIngresado("");
  }

  function cerrarOverlay() {
    setConciertoSeleccionado(null);
    setCodigoIngresado("");
    setErrorCodigo("");
  }

  async function validarCodigo() {
    if (codigoIngresado.trim() !== CODIGO_PRUEBA) {
      setErrorCodigo("Código incorrecto.");
      return;
    }

    const { error } = await supabase.from("usuarios_conciertos").insert([
      {
        id_usuario: usuarioActual.id_usuario,
        id_concierto: conciertoSeleccionado.id_concierto,
      },
    ]);

    if (error) {
      console.error("Error guardando acceso:", error);
      setErrorCodigo("Error guardando acceso: " + error.message);
      return;
    }

    await onEntrarConcierto(conciertoSeleccionado.id_concierto);
  }
  
function formatearFecha(fecha) {
  if (!fecha) return "Fecha a confirmar";

  const fechaTexto = String(fecha);
  const soloFecha = fechaTexto.split("T")[0];
  const partes = soloFecha.split("-");

  if (partes.length !== 3) return fechaTexto;

  const [anio, mes, dia] = partes;
  return `${dia}/${mes}/${anio.slice(2)}`;
}
  function renderCard(concierto) {
    return (
      <article
        className="home-card"
        key={concierto.id_concierto}
        onClick={() => abrirOverlay(concierto)}
      >
        <div className="home-card-imagen">
          <img
            src={
              concierto.imagen ||
              concierto.imagenConcierto ||
              concierto.foto ||
              ""
            }
            alt={concierto.nombre || concierto.artista?.nombre}
          />

          <button
            className="home-card-btn-unirme"
            onClick={(e) => {
              e.stopPropagation();
              abrirOverlay(concierto);
            }}
          >
            Unirme
          </button>
        </div>

        <div className="home-card-info">
          <h3>{concierto.nombre || concierto.artista?.nombre}</h3>

          <div className="home-card-meta">
            <span>
              {concierto.estadio?.nombre ||
                concierto.estadio?.ciudad ||
                "Estadio"}
            </span>
            <span>{formatearFecha(concierto.fecha)}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="pantalla-home">
      <header className="home-header">
        <div className="home-header-icons">
          <p className="home-eyebrow">FanMeet</p>
        </div>
      </header>

      <main className="home-main">
        <div className="home-search">
          <input
            type="text"
            placeholder="Buscá tu concierto o artista"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {cargando && <p className="home-estado">Cargando conciertos...</p>}

        {!cargando && conciertos.length === 0 && (
          <p className="home-estado">No hay conciertos disponibles.</p>
        )}

        {!cargando && hayBusqueda && (
          <section className="home-row">
            <div className="home-row-header">
              <h2>Resultados</h2>
              <span>{conciertosBuscados.length}</span>
            </div>

            {conciertosBuscados.length === 0 ? (
              <p className="home-estado">No encontramos conciertos.</p>
            ) : (
              <div className="home-resultados-grid">
                {conciertosBuscados.map((concierto) => renderCard(concierto))}
              </div>
            )}
          </section>
        )}

        {!cargando && !hayBusqueda && conciertos.length > 0 && (
          <section className="home-catalogo">
            <section className="home-row">
              <div className="home-row-header">
                <h2> Destacados</h2>
                <span>Todos</span>
              </div>

              <div className="home-row-scroll">
                {conciertos.slice(0, 10).map((concierto) => renderCard(concierto))}
              </div>
            </section>

            {generos.map((genero) => {
              const conciertosDelGenero = obtenerConciertosPorGenero(genero.id);

              if (conciertosDelGenero.length === 0) return null;

              return (
                <section className="home-row" key={genero.id}>
                  <div className="home-row-header">
                    <h2>
                      {genero.emoji} {genero.nombre}
                    </h2>
                    <span>{conciertosDelGenero.length}</span>
                  </div>

                  <div className="home-row-scroll">
                    {conciertosDelGenero.map((concierto) =>
                      renderCard(concierto)
                    )}
                  </div>
                </section>
              );
            })}
          </section>
        )}
      </main>

      {conciertoSeleccionado && (
        <div className="home-overlay">
          <div className="home-modal">
            <button className="home-modal-cerrar" onClick={cerrarOverlay}>
              ×
            </button>

            <p className="home-modal-eyebrow">Acceso al evento</p>
            <h2>{conciertoSeleccionado.nombre}</h2>
            <span>
              Ingresá el código que recibiste con tu entrada para desbloquear la
              comunidad del concierto.
            </span>

            <input
              type="text"
              value={codigoIngresado}
              onChange={(e) => {
                setCodigoIngresado(e.target.value);
                setErrorCodigo("");
              }}
              placeholder="Código de acceso"
            />

            {errorCodigo && <p className="home-error">{errorCodigo}</p>}

            <button className="home-btn-principal" onClick={validarCodigo}>
              Entrar al concierto
            </button>
          </div>
        </div>
      )}          
      <Footer onNavegar={onNavegar} />    
    </div>
  );
}


export default Home;