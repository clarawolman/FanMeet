import { useCallback, useContext, useEffect, useRef, useState } from "react";
import "./MomentoDetalle.css";
import HeaderApp from "../generales/HeaderApp";
import Footer from "../generales/Footer";
import LoadingSpinner from "../generales/LoadingSpinner";
import ModalConfirmacion from "../generales/ModalConfirmacion";
import PaginaNoEncontrada from "../generales/PaginaNoEncontrada";
import { IconoAnterior, IconoSiguiente } from "../generales/iconosNav";
import {
  IconoComentario,
  IconoCorazon,
  IconoEnviar,
  IconoFijado,
  IconoGuardar,
  IconoMas,
  IconoUbicacion,
} from "./iconosMomento";
import CompartirMomento from "./CompartirMomento";
import EditarMomento from "./EditarMomento";
import ListaLikes from "./ListaLikes";
import { momentosService, linkDeMomento } from "../../services/momentosService";
import { UsuarioContext } from "../../context/UsuarioContext";
import { haceCuanto, formatearFechaLarga } from "../../utils/fechas";
import { mostrarAviso } from "../../utils/avisos";

const LARGO_PIE_CORTO = 140;
const nombreDe = (u) => u?.apodo || u?.nombre || "Usuario";

// "ana y juan" / "ana, juan y 2 más"
function nombresParticipantes(participantes) {
  const nombres = participantes.map((u) => u.nombre);
  if (nombres.length <= 2) return nombres.join(" y ");
  return `${nombres.slice(0, 2).join(", ")} y ${nombres.length - 2} más`;
}

// ── Carrusel: deslizar (scroll-snap), flechas, puntitos y doble toque = me gusta
function Carrusel({ fotos, onDobleToque }) {
  const pistaRef = useRef(null);
  const ultimoToque = useRef(0);
  const [indice, setIndice] = useState(0);
  const [corazon, setCorazon] = useState(0);

  function irA(i) {
    const pista = pistaRef.current;
    if (pista) pista.scrollTo({ left: i * pista.clientWidth, behavior: "smooth" });
  }

  function alScrollear() {
    const pista = pistaRef.current;
    if (pista) setIndice(Math.round(pista.scrollLeft / pista.clientWidth));
  }

  function alTocar() {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < 300) {
      onDobleToque();
      setCorazon(ahora);
      ultimoToque.current = 0;
    } else {
      ultimoToque.current = ahora;
    }
  }

  return (
    <div className="momentoCarrusel">
      <div
        ref={pistaRef}
        className="momentoCarruselPista"
        onScroll={alScrollear}
        onClick={alTocar}
        aria-roledescription="carrusel"
      >
        {fotos.map((url, i) => (
          <div className="momentoCarruselFoto" key={url} aria-label={`Foto ${i + 1} de ${fotos.length}`}>
            <img src={url} alt="" draggable={false} />
          </div>
        ))}
      </div>

      {corazon > 0 && (
        <span key={corazon} className="momentoCorazonGrande" aria-hidden="true">
          <IconoCorazon lleno />
        </span>
      )}

      {fotos.length > 1 && (
        <>
          <span className="momentoCarruselContador">
            {indice + 1}/{fotos.length}
          </span>
          {indice > 0 && (
            <button
              type="button"
              className="momentoCarruselNav momentoCarruselNav--prev"
              onClick={() => irA(indice - 1)}
              aria-label="Foto anterior"
            >
              <IconoAnterior />
            </button>
          )}
          {indice < fotos.length - 1 && (
            <button
              type="button"
              className="momentoCarruselNav momentoCarruselNav--next"
              onClick={() => irA(indice + 1)}
              aria-label="Foto siguiente"
            >
              <IconoSiguiente />
            </button>
          )}
          <div className="momentoCarruselPuntos" aria-hidden="true">
            {fotos.map((url, i) => (
              <span key={url} className={i === indice ? "activo" : ""} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Un comentario (con sus respuestas si es de primer nivel)
function Comentario({ comentario, puedeBorrar, onResponder, onBorrar, onLike, onVerUsuario, esRespuesta }) {
  const [verRespuestas, setVerRespuestas] = useState(false);
  const respuestas = comentario.respuestas || [];

  return (
    <li className={`momentoComentario ${esRespuesta ? "momentoComentario--respuesta" : ""}`}>
      <button
        type="button"
        className="momentoComentarioFoto"
        onClick={() => onVerUsuario(comentario.usuario.id_usuario)}
        aria-label={`Ver el perfil de ${nombreDe(comentario.usuario)}`}
      >
        <img src={comentario.usuario.foto_perfil} alt="" />
      </button>

      <div className="momentoComentarioCuerpo">
        <p className="momentoComentarioTexto">
          <button type="button" className="momentoNombre" onClick={() => onVerUsuario(comentario.usuario.id_usuario)}>
            {comentario.usuario.nombre}
          </button>{" "}
          {comentario.texto}
        </p>
        <div className="momentoComentarioMeta">
          <time dateTime={comentario.created_at}>{haceCuanto(comentario.created_at)}</time>
          {comentario.cantidadLikes > 0 && (
            <span>
              {comentario.cantidadLikes} me gusta
            </span>
          )}
          {onResponder && (
            <button type="button" onClick={() => onResponder(comentario)}>
              Responder
            </button>
          )}
          {puedeBorrar(comentario) && (
            <button type="button" onClick={() => onBorrar(comentario)}>
              Eliminar
            </button>
          )}
        </div>

        {respuestas.length > 0 && (
          <>
            <button
              type="button"
              className="momentoVerRespuestas"
              onClick={() => setVerRespuestas((v) => !v)}
            >
              <span aria-hidden="true">——</span>{" "}
              {verRespuestas
                ? "Ocultar respuestas"
                : `Ver ${respuestas.length === 1 ? "1 respuesta" : `${respuestas.length} respuestas`}`}
            </button>
            {verRespuestas && (
              <ul className="momentoComentarios">
                {respuestas.map((r) => (
                  <Comentario
                    key={r.id_comentario}
                    comentario={r}
                    esRespuesta
                    puedeBorrar={puedeBorrar}
                    onResponder={onResponder}
                    onBorrar={onBorrar}
                    onLike={onLike}
                    onVerUsuario={onVerUsuario}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        className={`momentoComentarioLike ${comentario.yoDiLike ? "activo" : ""}`}
        onClick={() => onLike(comentario)}
        aria-label={comentario.yoDiLike ? "Quitar me gusta del comentario" : "Me gusta el comentario"}
        aria-pressed={comentario.yoDiLike}
      >
        <IconoCorazon lleno={comentario.yoDiLike} width="14" height="14" />
      </button>
    </li>
  );
}

// Pantalla de un momento: funciona como una publicación de Instagram.
export default function MomentoDetalle({ idMomento, onVolver, onNavegar, onVerUsuario, onIngresarConcierto }) {
  const { usuarioActual } = useContext(UsuarioContext);
  const [momento, setMomento] = useState(null);
  const [estado, setEstado] = useState("cargando"); // cargando | listo | noExiste
  const [comentario, setComentario] = useState("");
  const [respondiendoA, setRespondiendoA] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [pieCompleto, setPieCompleto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modal, setModal] = useState(null); // likes | compartir | editar | quitar
  const [quitando, setQuitando] = useState(false);
  const inputComentarioRef = useRef(null);

  // Vuelve a pedir el momento (al montar y después de comentar o borrar)
  const cargar = useCallback(
    () =>
      momentosService.obtener(idMomento).then(
        (datos) => {
          setMomento(datos);
          setEstado("listo");
        },
        (error) => {
          if (error.status === 404 || error.status === 422) {
            setEstado("noExiste");
            return;
          }
          mostrarAviso("No se pudo cargar el momento: " + error.message);
          setEstado((anterior) => (anterior === "cargando" ? "noExiste" : anterior));
        }
      ),
    [idMomento]
  );

  // App le pone key={idMomento}: otro momento es otro componente, así que
  // alcanza con cargar al montar.
  useEffect(() => {
    let cancelado = false;
    momentosService.obtener(idMomento).then(
      (datos) => {
        if (cancelado) return;
        setMomento(datos);
        setEstado("listo");
      },
      (error) => {
        if (cancelado) return;
        if (error.status !== 404 && error.status !== 422) {
          mostrarAviso("No se pudo cargar el momento: " + error.message);
        }
        setEstado("noExiste");
      }
    );
    return () => {
      cancelado = true;
    };
  }, [idMomento]);

  // Título de la pestaña con quién lo subió
  useEffect(() => {
    if (momento?.participantes?.[0]) {
      document.title = `FanMeet - Momento de ${nombreDe(momento.participantes[0])}`;
    }
  }, [momento]);

  if (estado === "noExiste") {
    return <PaginaNoEncontrada conSesion onIrAlInicio={() => onNavegar("home")} />;
  }

  if (estado === "cargando" || !momento) {
    return <LoadingSpinner texto="Cargando momento…" pantallaCompleta />;
  }

  const autor = momento.participantes[0];
  const puedeBorrar = (c) => momento.soyParticipante || c.usuario.id_usuario === usuarioActual?.id_usuario;

  // ── Me gusta (optimista)
  async function alternarLike(forzarLike = false) {
    const dar = forzarLike || !momento.yoDiLike;
    if (dar === momento.yoDiLike) return;
    const anterior = momento;
    setMomento({
      ...momento,
      yoDiLike: dar,
      cantidadLikes: momento.cantidadLikes === null ? null : momento.cantidadLikes + (dar ? 1 : -1),
    });
    try {
      if (dar) await momentosService.darLike(momento.id_highlight);
      else await momentosService.quitarLike(momento.id_highlight);
    } catch (error) {
      setMomento(anterior);
      mostrarAviso("No se pudo actualizar el me gusta: " + error.message);
    }
  }

  async function alternarGuardado() {
    const guardar = !momento.guardado;
    setMomento({ ...momento, guardado: guardar });
    try {
      if (guardar) await momentosService.guardar(momento.id_highlight);
      else await momentosService.quitarGuardado(momento.id_highlight);
      mostrarAviso(guardar ? "Guardado. Lo encontrás en tu perfil, en Guardados." : "Lo sacaste de Guardados.", "exito");
    } catch (error) {
      setMomento({ ...momento, guardado: !guardar });
      mostrarAviso("No se pudo guardar: " + error.message);
    }
  }

  async function alternarFijado() {
    setMenuAbierto(false);
    try {
      if (momento.fijado) await momentosService.desfijar(momento.id_highlight);
      else await momentosService.fijar(momento.id_highlight);
      setMomento({ ...momento, fijado: !momento.fijado });
      mostrarAviso(momento.fijado ? "Ya no está fijado en tu perfil." : "Fijado arriba de todo en tu perfil.", "exito");
    } catch (error) {
      mostrarAviso(error.message);
    }
  }

  async function copiarEnlace() {
    setMenuAbierto(false);
    try {
      await navigator.clipboard.writeText(linkDeMomento(momento.id_highlight));
      mostrarAviso("Enlace copiado.", "exito");
    } catch {
      mostrarAviso("No se pudo copiar. El enlace es: " + linkDeMomento(momento.id_highlight), "info");
    }
  }

  async function confirmarQuitar() {
    setQuitando(true);
    try {
      await momentosService.quitarDeMiPerfil(momento.id_highlight);
    } catch (error) {
      setQuitando(false);
      mostrarAviso("No se pudo quitar el momento: " + error.message);
      return;
    }
    setQuitando(false);
    setModal(null);
    mostrarAviso(momento.participantes.length > 1 ? "Lo sacaste de tus momentos." : "Momento eliminado.", "exito");
    onVolver();
  }

  // ── Comentarios
  function responder(c) {
    setRespondiendoA(c);
    setComentario(`@${c.usuario.nombre} `);
    inputComentarioRef.current?.focus();
  }

  async function enviarComentario(e) {
    e.preventDefault();
    const texto = comentario.trim();
    if (!texto || enviando) return;
    setEnviando(true);
    try {
      await momentosService.comentar(momento.id_highlight, texto, respondiendoA?.id_comentario ?? null);
      setComentario("");
      setRespondiendoA(null);
      await cargar();
    } catch (error) {
      mostrarAviso("No se pudo comentar: " + error.message);
    }
    setEnviando(false);
  }

  async function borrarComentario(c) {
    try {
      await momentosService.eliminarComentario(momento.id_highlight, c.id_comentario);
      await cargar();
    } catch (error) {
      mostrarAviso("No se pudo borrar el comentario: " + error.message);
    }
  }

  async function alternarLikeComentario(c) {
    try {
      if (c.yoDiLike) await momentosService.quitarLikeComentario(momento.id_highlight, c.id_comentario);
      else await momentosService.darLikeComentario(momento.id_highlight, c.id_comentario);
      await cargar();
    } catch (error) {
      mostrarAviso("No se pudo actualizar el me gusta: " + error.message);
    }
  }

  const cantidadComentarios = momento.comentarios.reduce((total, c) => total + 1 + c.respuestas.length, 0);
  const pieLargo = momento.descripcion.length > LARGO_PIE_CORTO;
  const pieVisible =
    pieLargo && !pieCompleto ? `${momento.descripcion.slice(0, LARGO_PIE_CORTO).trimEnd()}…` : momento.descripcion;

  return (
    <div className="pantallaMomento">
      <HeaderApp onVolver={onVolver} titulo="Momento" />

      <main className="momentoLayout">
        <article className="momento">
          {/* ── Cabecera: quiénes, concierto y menú ── */}
          <header className="momentoCabecera">
            <span className="momentoCabeceraFotos">
              {momento.participantes.slice(0, 2).map((u) => (
                <button
                  key={u.id_usuario}
                  type="button"
                  onClick={() => onVerUsuario(u.id_usuario)}
                  aria-label={`Ver el perfil de ${nombreDe(u)}`}
                >
                  <img src={u.foto_perfil} alt="" />
                </button>
              ))}
            </span>

            <div className="momentoCabeceraTexto">
              <p className="momentoCabeceraNombres">
                {momento.participantes.length <= 2 ? (
                  momento.participantes.map((u, i) => (
                    <span key={u.id_usuario}>
                      {i > 0 && " y "}
                      <button type="button" className="momentoNombre" onClick={() => onVerUsuario(u.id_usuario)}>
                        {u.nombre}
                      </button>
                    </span>
                  ))
                ) : (
                  <button type="button" className="momentoNombre" onClick={() => setModal("participantes")}>
                    {nombresParticipantes(momento.participantes)}
                  </button>
                )}
              </p>
              {momento.concierto && (
                <button
                  type="button"
                  className="momentoUbicacion"
                  onClick={() => onIngresarConcierto?.(momento.concierto.id_concierto)}
                >
                  <IconoUbicacion width="13" height="13" />
                  {momento.concierto.nombre}
                  {momento.concierto.fecha && ` · ${formatearFechaLarga(momento.concierto.fecha)}`}
                </button>
              )}
            </div>

            {momento.fijado && (
              <span className="momentoFijadoMarca" title="Fijado en tu perfil">
                <IconoFijado lleno width="16" height="16" />
              </span>
            )}

            <div className="momentoMenu">
              <button
                type="button"
                className="momentoIconoBoton"
                onClick={() => setMenuAbierto((v) => !v)}
                aria-label="Más opciones"
                aria-expanded={menuAbierto}
              >
                <IconoMas />
              </button>
              {menuAbierto && (
                <>
                  <button
                    type="button"
                    className="momentoMenuFondo"
                    aria-label="Cerrar menú"
                    onClick={() => setMenuAbierto(false)}
                  />
                  <ul className="momentoMenuLista" role="menu">
                    {momento.soyAutor && (
                      <li>
                        <button type="button" role="menuitem" onClick={() => { setMenuAbierto(false); setModal("editar"); }}>
                          Editar
                        </button>
                      </li>
                    )}
                    {momento.soyParticipante && (
                      <li>
                        <button type="button" role="menuitem" onClick={alternarFijado}>
                          {momento.fijado ? "Desfijar de mi perfil" : "Fijar en mi perfil"}
                        </button>
                      </li>
                    )}
                    <li>
                      <button type="button" role="menuitem" onClick={() => { setMenuAbierto(false); setModal("compartir"); }}>
                        Compartir
                      </button>
                    </li>
                    <li>
                      <button type="button" role="menuitem" onClick={copiarEnlace}>
                        Copiar enlace
                      </button>
                    </li>
                    {autor && !momento.soyParticipante && (
                      <li>
                        <button type="button" role="menuitem" onClick={() => onVerUsuario(autor.id_usuario)}>
                          Ir al perfil de {autor.nombre}
                        </button>
                      </li>
                    )}
                    {momento.soyParticipante && (
                      <li>
                        <button
                          type="button"
                          role="menuitem"
                          className="momentoMenuPeligro"
                          onClick={() => { setMenuAbierto(false); setModal("quitar"); }}
                        >
                          {momento.participantes.length > 1 ? "Quitar de mis momentos" : "Eliminar"}
                        </button>
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          </header>

          {/* ── Fotos ── */}
          <Carrusel fotos={momento.fotos} onDobleToque={() => alternarLike(true)} />

          {/* ── Panel: acciones, pie y comentarios ── */}
          <div className="momentoPanel">
            <div className="momentoAcciones">
              <button
                type="button"
                className={`momentoIconoBoton momentoLike ${momento.yoDiLike ? "activo" : ""}`}
                onClick={() => alternarLike()}
                aria-label={momento.yoDiLike ? "Ya no me gusta" : "Me gusta"}
                aria-pressed={momento.yoDiLike}
              >
                <IconoCorazon lleno={momento.yoDiLike} />
              </button>
              <button
                type="button"
                className="momentoIconoBoton"
                onClick={() => inputComentarioRef.current?.focus()}
                disabled={!momento.comentariosActivados}
                aria-label="Comentar"
              >
                <IconoComentario />
              </button>
              <button
                type="button"
                className="momentoIconoBoton"
                onClick={() => setModal("compartir")}
                aria-label="Compartir"
              >
                <IconoEnviar />
              </button>
              <button
                type="button"
                className={`momentoIconoBoton momentoGuardar ${momento.guardado ? "activo" : ""}`}
                onClick={alternarGuardado}
                aria-label={momento.guardado ? "Quitar de guardados" : "Guardar"}
                aria-pressed={momento.guardado}
              >
                <IconoGuardar lleno={momento.guardado} />
              </button>
            </div>

            {momento.cantidadLikes !== null && (
              <p className="momentoLikes">
                {momento.cantidadLikes === 0 ? (
                  <span className="momentoMuted">Sé la primera persona en darle me gusta</span>
                ) : (
                  <button type="button" onClick={() => setModal("likes")}>
                    {momento.cantidadLikes} me gusta
                  </button>
                )}
                {momento.ocultarLikes && <span className="momentoMuted"> · solo lo ven ustedes</span>}
              </p>
            )}

            {momento.descripcion && (
              <p className="momentoPie">
                <button type="button" className="momentoNombre" onClick={() => onVerUsuario(autor.id_usuario)}>
                  {autor.nombre}
                </button>{" "}
                {pieVisible}
                {pieLargo && !pieCompleto && (
                  <button type="button" className="momentoMas" onClick={() => setPieCompleto(true)}>
                    más
                  </button>
                )}
              </p>
            )}

            <p className="momentoFecha">
              <time dateTime={momento.created_at}>{haceCuanto(momento.created_at)}</time>
              {momento.editado && " · Editado"}
            </p>

            <section className="momentoSeccionComentarios" aria-label="Comentarios">
              {cantidadComentarios > 0 && (
                <h2 className="momentoComentariosTitulo">
                  {cantidadComentarios} {cantidadComentarios === 1 ? "comentario" : "comentarios"}
                </h2>
              )}

              <ul className="momentoComentarios">
                {momento.comentarios.map((c) => (
                  <Comentario
                    key={c.id_comentario}
                    comentario={c}
                    puedeBorrar={puedeBorrar}
                    onResponder={momento.comentariosActivados ? responder : null}
                    onBorrar={borrarComentario}
                    onLike={alternarLikeComentario}
                    onVerUsuario={onVerUsuario}
                  />
                ))}
              </ul>

              {momento.comentariosActivados ? (
                <form className="momentoComentar" onSubmit={enviarComentario}>
                  <img src={usuarioActual?.fotoperfil || usuarioActual?.foto_perfil} alt="" />
                  <div className="momentoComentarCampo">
                    {respondiendoA && (
                      <span className="momentoRespondiendo">
                        Respondiendo a {respondiendoA.usuario.nombre}
                        <button
                          type="button"
                          onClick={() => {
                            setRespondiendoA(null);
                            setComentario("");
                          }}
                          aria-label="Cancelar respuesta"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    <input
                      ref={inputComentarioRef}
                      type="text"
                      maxLength={500}
                      placeholder="Agregá un comentario…"
                      aria-label="Comentario"
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                    />
                  </div>
                  <button type="submit" disabled={!comentario.trim() || enviando}>
                    {enviando ? "…" : "Publicar"}
                  </button>
                </form>
              ) : (
                <p className="momentoMuted momentoSinComentarios">Los comentarios están desactivados.</p>
              )}
            </section>
          </div>
        </article>
      </main>

      <Footer onNavegar={onNavegar} />

      {(modal === "likes" || modal === "participantes") && (
        <ListaLikes
          titulo={modal === "likes" ? "Me gusta" : "Comparten este momento"}
          cargarUsuarios={
            modal === "likes"
              ? () => momentosService.listarLikes(momento.id_highlight)
              : async () => momento.participantes
          }
          onCerrar={() => setModal(null)}
          onVerUsuario={(id) => {
            setModal(null);
            onVerUsuario(id);
          }}
        />
      )}

      {modal === "compartir" && (
        <CompartirMomento idMomento={momento.id_highlight} onCerrar={() => setModal(null)} />
      )}

      {modal === "editar" && (
        <EditarMomento
          momento={momento}
          onCerrar={() => setModal(null)}
          onGuardado={(actualizado) => {
            setMomento(actualizado);
            setModal(null);
            mostrarAviso("Cambios guardados.", "exito");
          }}
        />
      )}

      {modal === "quitar" && (
        <ModalConfirmacion
          mensaje={
            momento.participantes.length > 1
              ? "¿Quitarlo de tus momentos? A los demás les sigue apareciendo en su perfil."
              : "¿Eliminar este momento? Se borran las fotos, los me gusta y los comentarios."
          }
          textoConfirmar={momento.participantes.length > 1 ? "Quitar" : "Eliminar"}
          textoCancelar="Cancelar"
          confirmando={quitando}
          onConfirmar={confirmarQuitar}
          onCancelar={() => setModal(null)}
        />
      )}
    </div>
  );
}
