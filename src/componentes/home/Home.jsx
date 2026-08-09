import { useEffect, useState } from "react";
import "./Home.css";
import OverlayCodigo from "./OverlayCodigo";
import { supabase } from "../../supabase";
import { crearNotificacion } from "../../notificaciones";
import Footer from "../generales/Footer";
import IconoCampana from "../generales/IconoCampana";

function Home({ usuarioActual, onEntrarConcierto, onNavegar }) {
  const [conciertos, setConciertos] = useState([]);
  const [conciertosUnidos, setConciertosUnidos] = useState([]);
  const [conciertoSeleccionado, setConciertoSeleccionado] = useState(null);
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [errorCodigo, setErrorCodigo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [generosPreferidosIds, setGenerosPreferidosIds] = useState([]);
  const [cantidadNotificaciones, setCantidadNotificaciones] = useState(0);

  const CODIGO_PRUEBA = "FANMEET2026";

  const generos = [
    { id: "1", nombre: "Pop" },
    { id: "2", nombre: "Rock" },
    { id: "3", nombre: "Urbano" },
    { id: "4", nombre: "Indie" },
  ];

  useEffect(() => {
    if (usuarioActual?.id_usuario) {
      cargarDatosHome();
    }
  }, [usuarioActual]);

  async function cargarDatosHome() {
    setCargando(true);

    await Promise.all([
      cargarConciertos(),
      cargarConciertosDelUsuario(),
      cargarPreferenciasUsuario(),
      cargarCantidadNotificaciones(),
    ]);

    setCargando(false);
  }

  async function cargarCantidadNotificaciones() {
    const { count, error } = await supabase
      .from("notificacion")
      .select("*", { count: "exact", head: true })
      .eq("id_usuario", usuarioActual.id_usuario)
      .eq("leida", false);

    if (error) {
      console.error("Error cargando notificaciones:", error);
      setCantidadNotificaciones(0);
      return;
    }

    setCantidadNotificaciones(count || 0);
  }

  async function cargarConciertos() {
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
      return;
    }

    setConciertos(data || []);
  }

  async function cargarConciertosDelUsuario() {
    const { data, error } = await supabase
      .from("usuarios_conciertos")
      .select("id_concierto")
      .eq("id_usuario", usuarioActual.id_usuario);

    if (error) {
      console.error("Error cargando conciertos del usuario:", error);
      setConciertosUnidos([]);
      return;
    }

    setConciertosUnidos((data || []).map((item) => item.id_concierto));
  }
async function cargarPreferenciasUsuario() {
  const { data, error } = await supabase
    .from("estilo_musical_usuario")
    .select("id_estilo")
    .eq("id_usuario", usuarioActual.id_usuario);

  if (error) {
    console.error("Error cargando preferencias del usuario:", error);
    setGenerosPreferidosIds([]);
    return;
  }

  const idsPreferidos = (data || []).map((item) => String(item.id_estilo));

  console.log("Preferencias del usuario:", idsPreferidos);

  setGenerosPreferidosIds(idsPreferidos);
}

  function usuarioYaEstaUnido(idConcierto) {
    return conciertosUnidos.some(
      (id) => String(id) === String(idConcierto)
    );
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
const generosOrdenados = [...generos].sort((a, b) => {
  const posicionA = generosPreferidosIds.indexOf(String(a.id));
  const posicionB = generosPreferidosIds.indexOf(String(b.id));

  const aEsPreferido = posicionA !== -1;
  const bEsPreferido = posicionB !== -1;

  if (aEsPreferido && bEsPreferido) {
    return posicionA - posicionB;
  }

  if (aEsPreferido && !bEsPreferido) return -1;
  if (!aEsPreferido && bEsPreferido) return 1;

  return 0;
});

  function obtenerConciertosPorGenero(idGenero) {
    return conciertos.filter(
      (concierto) => String(concierto.id_estiloMusical) === String(idGenero)
    );
  }

  async function abrirConcierto(concierto) {
    if (usuarioYaEstaUnido(concierto.id_concierto)) {
      await onEntrarConcierto(concierto.id_concierto);
      return;
    }

    setErrorCodigo("");
    setCodigoIngresado("");
    setConciertoSeleccionado(concierto);
  }

  function cerrarOverlay() {
    setConciertoSeleccionado(null);
    setCodigoIngresado("");
    setErrorCodigo("");
  }

  async function validarCodigo() {
    if (!conciertoSeleccionado) return;

    if (codigoIngresado.trim() !== CODIGO_PRUEBA) {
      setErrorCodigo("Código incorrecto.");
      return;
    }

    const idConcierto = conciertoSeleccionado.id_concierto;

    const { data: relacionExistente, error: errorConsulta } = await supabase
      .from("usuarios_conciertos")
      .select("*")
      .eq("id_usuario", usuarioActual.id_usuario)
      .eq("id_concierto", idConcierto)
      .maybeSingle();

    if (errorConsulta) {
      console.error("Error verificando acceso:", errorConsulta);
      setErrorCodigo("Error verificando acceso.");
      return;
    }

    if (!relacionExistente) {
      const { error: errorInsert } = await supabase
        .from("usuarios_conciertos")
        .insert([
          {
            id_usuario: usuarioActual.id_usuario,
            id_concierto: idConcierto,
          },
        ]);

      if (errorInsert) {
        console.error("Error guardando acceso:", errorInsert);
        setErrorCodigo("Error guardando acceso: " + errorInsert.message);
        return;
      }

      await crearNotificacion({
        idUsuario: usuarioActual.id_usuario,
        tipo: "concierto_unido",
        titulo: `Te uniste a ${
          conciertoSeleccionado.nombre ||
          conciertoSeleccionado.artista?.nombre ||
          "un concierto"
        }`,
        descripcion:
          conciertoSeleccionado.estadio?.nombre ||
          conciertoSeleccionado.estadio?.ciudad ||
          "",
        imagen:
          conciertoSeleccionado.imagen ||
          conciertoSeleccionado.imagenConcierto ||
          conciertoSeleccionado.foto ||
          "",
        idConcierto,
      });
    }

    setConciertosUnidos((anteriores) => {
      const yaExiste = anteriores.some(
        (id) => String(id) === String(idConcierto)
      );

      if (yaExiste) return anteriores;

      return [...anteriores, idConcierto];
    });

    cerrarOverlay();
    await onEntrarConcierto(idConcierto);
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
    const yaUnido = usuarioYaEstaUnido(concierto.id_concierto);

    return (
      <article
        className="home-card"
        key={concierto.id_concierto}
        onClick={() => abrirConcierto(concierto)}
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
            className={
              yaUnido
                ? "home-card-btn-unirme home-card-btn-unirme--ver"
                : "home-card-btn-unirme"
            }
            onClick={(e) => {
              e.stopPropagation();
              abrirConcierto(concierto);
            }}
          >
            {yaUnido ? "Ver concierto" : "Unirme"}
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

        <button
          type="button"
          className="home-header-bell"
          onClick={() => onNavegar("notificaciones")}
          aria-label="Notificaciones"
        >
          <IconoCampana />
          {cantidadNotificaciones > 0 && (
            <span className="home-header-bell-badge">
              {cantidadNotificaciones > 9 ? "9+" : cantidadNotificaciones}
            </span>
          )}
        </button>
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
                <h2>Destacados</h2>
                <span>Todos</span>
              </div>

              <div className="home-row-scroll">
                {conciertos
                  .slice(0, 10)
                  .map((concierto) => renderCard(concierto))}
              </div>
            </section>

            {generosOrdenados.map((genero) => {
              const conciertosDelGenero = obtenerConciertosPorGenero(genero.id);

              if (conciertosDelGenero.length === 0) return null;

              return (
                <section className="home-row" key={genero.id}>
                  <div className="home-row-header">
                    <h2>{genero.nombre}</h2>
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
        <OverlayCodigo
          conciertoSeleccionado={conciertoSeleccionado}
          codigoIngresado={codigoIngresado}
          errorCodigo={errorCodigo}
          onCambiarCodigo={(valor) => {
            setCodigoIngresado(valor);
            setErrorCodigo("");
          }}
          onCerrar={cerrarOverlay}
          onValidar={validarCodigo}
        />
      )}

      <Footer onNavegar={onNavegar} pantallaActiva="home" />
    </div>
  );
}

export default Home;