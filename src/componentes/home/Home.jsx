import { useContext, useEffect, useState } from "react";
import "./Home.css";
import OverlayCodigo from "./OverlayCodigo";
import SelectorFechas from "./SelectorFechas";
import { agruparFechasSeguidas } from "../../utils/carpetasConciertos";
import { conciertosService } from "../../services/conciertosService";
import { usuariosService } from "../../services/usuariosService";
import { notificacionesService } from "../../services/notificacionesService";
import { matchingService } from "../../services/matchingService";
import { idDeGenero, nombreDeGenero } from "../../utils/generos";
import { partesFecha } from "../../utils/fechas";
import Footer from "../generales/Footer";
import HeaderApp from "../generales/HeaderApp";
import IconoCampana from "../generales/IconoCampana";
import Buscador from "../generales/Buscador";
import CarruselFila from "./CarruselFila";
import FansCompatiblesHome from "./FansCompatiblesHome";
import BotonChatbot from "../chatbot/BotonChatbot";
import { UsuarioContext } from "../../context/UsuarioContext";

function EsqueletoFila() {
  return (
    <div className="home-esqueleto" aria-hidden="true">
      <div className="fmSkeleton" />
      <div className="fmSkeleton" />
      <div className="fmSkeleton" />
      <div className="fmSkeleton" />
    </div>
  );
}

function capitalizar(texto) {
  return texto ? texto[0].toUpperCase() + texto.slice(1) : texto;
}

function Home({ onEntrarConcierto, onNavegar, onVerUsuario, onAbrirChatbot }) {
  const { usuarioActual } = useContext(UsuarioContext);
  const [conciertos, setConciertos] = useState([]);
  const [conciertosUnidos, setConciertosUnidos] = useState([]);
  const [conciertoSeleccionado, setConciertoSeleccionado] = useState(null);
  // Fechas de la carpeta abierta (SelectorFechas), o null.
  const [carpetaAbierta, setCarpetaAbierta] = useState(null);
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

  function renderCard(concierto, motivo) {
    const yaUnido = usuarioYaEstaUnido(concierto.id_concierto);
    const fecha = partesFecha(concierto.fecha);
    const titulo = concierto.nombre || concierto.artista?.nombre;
    const cantidadFans = concierto.cantidadFans ?? 0;
    const cantidadGrupos = concierto.cantidadGrupos ?? 0;

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
            alt={titulo}
            draggable={false}
          />

          {fecha && (
            <time className="home-card-fecha" dateTime={String(concierto.fecha).slice(0, 10)}>
              <span>{fecha.mes}</span>
              <strong>{fecha.dia}</strong>
            </time>
          )}

          {yaUnido && (
            <span className="home-card-badge-unido">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Te uniste
            </span>
          )}
        </div>

        <div className="home-card-info">
          {concierto.nombre && concierto.artista?.nombre && (
            <p className="home-card-artista">{concierto.artista.nombre}</p>
          )}

          <h3>{titulo}</h3>

          <p className="home-card-meta">
            {concierto.estadio?.nombre || concierto.estadio?.ciudad || "Estadio a confirmar"}
            {fecha && <> · {fecha.anio}</>}
          </p>

          {motivo && <p className="home-card-motivo">{motivo}</p>}

          <div className="home-card-pie">
            <span className="home-card-stats fmDato">
              {cantidadFans} {cantidadFans === 1 ? "fan" : "fans"} · {cantidadGrupos}{" "}
              {cantidadGrupos === 1 ? "grupo" : "grupos"}
            </span>

            <button
              type="button"
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
              {yaUnido ? "Ver" : "Unirme"}
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Un artista varios días seguidos en el mismo estadio: una sola card con
  // las fechas apiladas. Al tocarla se elige la fecha (SelectorFechas).
  function renderCarpeta(fechas, motivo) {
    const primera = fechas[0];
    const ultima = fechas[fechas.length - 1];
    const desde = partesFecha(primera.fecha);
    const hasta = partesFecha(ultima.fecha);
    const titulo = primera.artista?.nombre || primera.nombre;
    const mismoNombre = fechas.every((c) => c.nombre === primera.nombre);
    const cantidadFans = fechas.reduce((total, c) => total + (c.cantidadFans ?? 0), 0);
    const cantidadGrupos = fechas.reduce((total, c) => total + (c.cantidadGrupos ?? 0), 0);
    const unidoAAlguna = fechas.some((c) => usuarioYaEstaUnido(c.id_concierto));

    return (
      <article
        className="home-card home-card--carpeta"
        key={`carpeta-${primera.id_concierto}`}
        onClick={() => setCarpetaAbierta(fechas)}
      >
        <div className="home-card-imagen">
          <img src={primera.imagen || primera.imagenConcierto || ""} alt={titulo} draggable={false} />

          {desde && hasta && (
            <time className="home-card-fecha" dateTime={String(primera.fecha).slice(0, 10)}>
              <span>{desde.mes === hasta.mes ? desde.mes : `${desde.mes}–${hasta.mes}`}</span>
              <strong>
                {desde.dia}–{hasta.dia}
              </strong>
            </time>
          )}

          <span className="home-card-badge-unido home-card-badge-fechas">
            {unidoAAlguna && (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {fechas.length} fechas
          </span>
        </div>

        <div className="home-card-info">
          {mismoNombre && primera.nombre && primera.artista?.nombre && (
            <p className="home-card-artista">{primera.artista.nombre}</p>
          )}

          <h3>{mismoNombre && primera.nombre ? primera.nombre : titulo}</h3>

          <p className="home-card-meta">
            {primera.estadio?.nombre || primera.estadio?.ciudad || "Estadio a confirmar"}
            {desde && <> · {desde.anio}</>}
          </p>

          {motivo && <p className="home-card-motivo">{motivo}</p>}

          <div className="home-card-pie">
            <span className="home-card-stats fmDato">
              {cantidadFans} {cantidadFans === 1 ? "fan" : "fans"} · {cantidadGrupos}{" "}
              {cantidadGrupos === 1 ? "grupo" : "grupos"}
            </span>

            <button
              type="button"
              className="home-card-btn-unirme home-card-btn-unirme--ver"
              onClick={(e) => {
                e.stopPropagation();
                setCarpetaAbierta(fechas);
              }}
            >
              Ver fechas
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Para las filas: agrupa las fechas seguidas y dibuja cada elemento.
  function renderLista(lista, { conMotivo = false, maximo } = {}) {
    const items = agruparFechasSeguidas(lista);
    return (maximo ? items.slice(0, maximo) : items).map((item) =>
      item.carpeta
        ? renderCarpeta(item.fechas, conMotivo ? item.fechas[0].motivo : null)
        : renderCard(item, conMotivo ? item.motivo : null)
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
        <div className="home-intro">
          {usuarioActual?.nombre && (
            <p className="home-saludo">Hola, {usuarioActual.nombre}</p>
          )}
          <h1>¿A qué recital vas?</h1>

          <Buscador
            valor={busqueda}
            onCambiar={setBusqueda}
            etiqueta="Buscar conciertos"
            placeholder="Artista, show, estadio o ciudad"
          />
        </div>

        {cargando && <EsqueletoFila />}

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
                {renderLista(conciertosBuscados)}
              </div>
            )}
          </section>
        )}

        {!cargando && !hayBusqueda && conciertos.length > 0 && (
          <section className="home-catalogo">
            <section className="home-row home-row--destacada">
              <div className="home-row-header">
                <h2>Para vos</h2>
                <span>Según tus artistas y géneros</span>
              </div>

              {cargandoRecomendados && conciertosRecomendados.length === 0 && <EsqueletoFila />}

              {!cargandoRecomendados && conciertosRecomendados.length === 0 && (
                <div className="home-recomendados-vacio">
                  <p>
                    Sumá tus artistas favoritos y géneros (o vinculá Last.fm) para
                    recibir conciertos recomendados.
                  </p>
                  <button className="fmBotonPrimario" type="button" onClick={() => onNavegar("perfil")}>
                    Completar mi perfil
                  </button>
                </div>
              )}

              {conciertosRecomendados.length > 0 && (
                <CarruselFila>
                  {renderLista(conciertosRecomendados, { conMotivo: true })}
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
              </div>

              <CarruselFila>
                {renderLista(conciertos, { maximo: 10 })}
              </CarruselFila>
            </section>

            {generosOrdenados.map((genero) => {
              const conciertosDelGenero = obtenerConciertosPorGenero(genero.id);

              if (conciertosDelGenero.length === 0) return null;

              return (
                <section className="home-row" key={genero.id}>
                  <div className="home-row-header">
                    <h2>{genero.nombre}</h2>
                    <span>
                      {conciertosDelGenero.length}{" "}
                      {conciertosDelGenero.length === 1 ? "concierto" : "conciertos"}
                    </span>
                  </div>

                  <CarruselFila>
                    {renderLista(conciertosDelGenero)}
                  </CarruselFila>
                </section>
              );
            })}
          </section>
        )}
      </main>

      {carpetaAbierta && (
        <SelectorFechas
          fechas={carpetaAbierta}
          estaUnido={usuarioYaEstaUnido}
          onElegir={(concierto) => {
            setCarpetaAbierta(null);
            abrirConcierto(concierto);
          }}
          onCerrar={() => setCarpetaAbierta(null)}
        />
      )}

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

      <BotonChatbot onAbrir={onAbrirChatbot} />

      <Footer onNavegar={onNavegar} pantallaActiva="home" />
    </div>
  );
}

export default Home;