import { useContext, useEffect, useState } from "react";
import "./Home.css";
import OverlayCodigo from "./OverlayCodigo";
import { conciertosService } from "../../services/conciertosService";
import { usuariosService } from "../../services/usuariosService";
import { notificacionesService } from "../../services/notificacionesService";
import { matchingService } from "../../services/matchingService";
import { idDeGenero, nombreDeGenero } from "../../utils/generos";
import Footer from "../generales/Footer";
import HeaderApp from "../generales/HeaderApp";
import IconoCampana from "../generales/IconoCampana";
import LoadingSpinner from "../generales/LoadingSpinner";
import CarruselFila from "./CarruselFila";
import FansCompatiblesHome from "./FansCompatiblesHome";
import { UsuarioContext } from "../../context/UsuarioContext";

function capitalizar(texto) {
  return texto ? texto[0].toUpperCase() + texto.slice(1) : texto;
}

function Home({ onEntrarConcierto, onNavegar, onVerUsuario }) {
  const { usuarioActual } = useContext(UsuarioContext);
  const [conciertos, setConciertos] = useState([]);
  const [conciertosUnidos, setConciertosUnidos] = useState([]);
  const [conciertoSeleccionado, setConciertoSeleccionado] = useState(null);
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [errorCodigo, setErrorCodigo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [generosPreferidosIds, setGenerosPreferidosIds] = useState([]);
  const [cantidadNotificaciones, setCantidadNotificaciones] = useState(0);
  const [generos, setGeneros] = useState([]);
  // Lo que depende del matching tarda más (consulta Last.fm): se carga
  // aparte, sin frenar el resto de la home.
  const [recomendados, setRecomendados] = useState([]);
  const [cargandoRecomendados, setCargandoRecomendados] = useState(true);
  const [fansCompatibles, setFansCompatibles] = useState([]);
  const [soloFansCercanos, setSoloFansCercanos] = useState(false);

  useEffect(() => {
    if (!usuarioActual?.id_usuario) return;
    let cancelado = false;

    matchingService
      .conciertosRecomendados()
      .then((datos) => !cancelado && setRecomendados(datos || []))
      .catch((error) => console.error("Error cargando recomendaciones:", error))
      .finally(() => !cancelado && setCargandoRecomendados(false));

    matchingService
      .descubrir()
      .then((datos) => {
        if (cancelado) return;
        setFansCompatibles(datos?.fans || []);
        setSoloFansCercanos(Boolean(datos?.soloCercanos));
      })
      .catch((error) => console.error("Error cargando fans compatibles:", error));

    return () => {
      cancelado = true;
    };
  }, [usuarioActual?.id_usuario]);

  useEffect(() => {
    if (!usuarioActual?.id_usuario) return;
    let cancelado = false;

    // Cada dato se guarda apenas llega; si falla queda vacío y se sigue.
    function cargar(promesa, guardar, vacio, mensaje) {
      return promesa
        .then((datos) => !cancelado && guardar(datos))
        .catch((error) => {
          console.error(mensaje, error);
          if (!cancelado) guardar(vacio);
        });
    }

    Promise.all([
      cargar(
        conciertosService.listar(),
        (data) => setConciertos(data || []),
        [],
        "Error cargando conciertos:"
      ),
      cargar(
        conciertosService.listarMisEventos(),
        (data) => setConciertosUnidos((data || []).map((item) => item.id_concierto)),
        [],
        "Error cargando conciertos del usuario:"
      ),
      cargar(
        usuariosService.obtenerMisGeneros(),
        (ids) => setGenerosPreferidosIds((ids || []).map((id) => String(id))),
        [],
        "Error cargando preferencias del usuario:"
      ),
      cargar(
        notificacionesService.contarNoLeidas(),
        (count) => setCantidadNotificaciones(count || 0),
        0,
        "Error cargando notificaciones:"
      ),
      // Una fila por cada género que tenga conciertos (las vacías no se muestran).
      cargar(
        usuariosService.obtenerCatalogoGeneros(),
        (catalogo) =>
          setGeneros(
            (catalogo || []).map((genero) => ({
              id: String(idDeGenero(genero)),
              nombre: capitalizar(nombreDeGenero(genero)),
            }))
          ),
        [],
        "Error cargando géneros:"
      ),
    ]).then(() => !cancelado && setCargando(false));

    return () => {
      cancelado = true;
    };
  }, [usuarioActual?.id_usuario]);

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

  // Conciertos recomendados según los gustos del usuario (artistas, Last.fm
  // y géneros, calculado en el backend). Si el backend no encuentra nada,
  // se usan los conciertos de sus géneros preferidos a los que no se unió.
  const recomendadosPorGenero = conciertos
    .filter(
      (concierto) =>
        generosPreferidosIds.includes(String(concierto.id_estiloMusical)) &&
        !usuarioYaEstaUnido(concierto.id_concierto)
    )
    .slice(0, 10)
    .map((concierto) => {
      const genero = generos.find((g) => g.id === String(concierto.id_estiloMusical));
      return { ...concierto, motivo: genero ? `Te gusta el ${genero.nombre.toLowerCase()}` : null };
    });

  const conciertosRecomendados =
    recomendados.length > 0 ? recomendados : recomendadosPorGenero;

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

    const idConcierto = conciertoSeleccionado.id_concierto;

    try {
      await conciertosService.unirsePorCodigo(idConcierto, codigoIngresado.trim());
    } catch (error) {
      console.error("Error validando código:", error);
      setErrorCodigo(error.message || "Código incorrecto.");
      return;
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

  function renderCard(concierto, motivo) {
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
            draggable={false}
          />

          {yaUnido && (
            <span className="home-card-badge-unido">✓ Unido</span>
          )}

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

          {concierto.nombre && concierto.artista?.nombre && (
            <p className="home-card-artista">{concierto.artista.nombre}</p>
          )}

          {motivo && <p className="home-card-motivo">♪ {motivo}</p>}

          <div className="home-card-meta">
            <span>
              {concierto.estadio?.nombre ||
                concierto.estadio?.ciudad ||
                "Estadio"}
            </span>
            <span>{formatearFecha(concierto.fecha)}</span>
          </div>

          <div className="home-card-stats">
            <span>
              {concierto.cantidadGrupos ?? 0}{" "}
              {concierto.cantidadGrupos === 1 ? "grupo" : "grupos"}
            </span>
            <span>
              {concierto.cantidadFans ?? 0}{" "}
              {concierto.cantidadFans === 1 ? "fan unido" : "fans unidos"}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div className="pantalla-home">
      <HeaderApp
        acciones={
          <div className="home-header-right">
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

            <button
              type="button"
              className="home-header-avatar"
              onClick={() => onNavegar("perfil")}
              aria-label="Mi perfil"
            >
              <img
                src={usuarioActual?.fotoperfil || usuarioActual?.foto_perfil}
                alt={usuarioActual?.nombre}
              />
            </button>
          </div>
        }
      />

      <main className="home-main">
        <div className="home-search">
          <div className="home-search-campo">
            <span className="home-search-icono" aria-hidden="true">⌕</span>

            <input
              type="text"
              placeholder="Buscá tu concierto o artista"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {cargando && <LoadingSpinner texto="Cargando conciertos..." />}

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
                <h2>Conciertos recomendados</h2>
                <span>Según tus gustos</span>
              </div>

              {cargandoRecomendados && conciertosRecomendados.length === 0 && (
                <p className="home-estado">Buscando conciertos para vos...</p>
              )}

              {!cargandoRecomendados && conciertosRecomendados.length === 0 && (
                <div className="home-recomendados-vacio">
                  <p>
                    Sumá tus artistas favoritos y géneros (o vinculá Last.fm) para
                    recibir conciertos recomendados.
                  </p>
                  <button type="button" onClick={() => onNavegar("perfil")}>
                    Completar mi perfil
                  </button>
                </div>
              )}

              {conciertosRecomendados.length > 0 && (
                <CarruselFila>
                  {conciertosRecomendados.map((concierto) =>
                    renderCard(concierto, concierto.motivo)
                  )}
                </CarruselFila>
              )}
            </section>

            {fansCompatibles.length > 0 && (
              <FansCompatiblesHome
                fans={fansCompatibles}
                soloCercanos={soloFansCercanos}
                onVerUsuario={onVerUsuario}
                onVerTodos={() => onNavegar("descubrir")}
              />
            )}

            <section className="home-row">
              <div className="home-row-header">
                <h2>Destacados</h2>
                <span>Todos</span>
              </div>

              <CarruselFila>
                {conciertos
                  .slice(0, 10)
                  .map((concierto) => renderCard(concierto))}
              </CarruselFila>
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

                  <CarruselFila>
                    {conciertosDelGenero.map((concierto) =>
                      renderCard(concierto)
                    )}
                  </CarruselFila>
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