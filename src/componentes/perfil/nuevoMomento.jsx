import { useContext, useEffect, useMemo, useRef, useState } from "react";
import "./nuevoMomento.css";
import { amistadService } from "../../services/amistadService";
import { conciertosService } from "../../services/conciertosService";
import { momentosService } from "../../services/momentosService";
import { UsuarioContext } from "../../context/UsuarioContext";
import { IconoAnterior, IconoBuscar, IconoCerrar, IconoSiguiente } from "../generales/iconosNav";
import { formatearFechaLarga } from "../../utils/fechas";
import { mostrarAviso } from "../../utils/avisos";

const MAX_FOTOS = 10;
const MAX_ETIQUETADOS = 10;
const MAX_DESCRIPCION = 2200;

// Crear un momento como un post de Instagram: varias fotos (se pueden
// reordenar y sacar), pie de foto, el concierto (la "ubicación"), amigos
// etiquetados (les llega la invitación) y opciones avanzadas.
export default function NuevoMomento({ fotos: fotosIniciales, onPublicado, onCancelar }) {
  const { usuarioActual } = useContext(UsuarioContext);
  const inputMasFotosRef = useRef(null);
  const [fotos, setFotos] = useState(fotosIniciales);
  const [actual, setActual] = useState(0);
  const [descripcion, setDescripcion] = useState("");
  const [idConcierto, setIdConcierto] = useState("");
  const [conciertos, setConciertos] = useState([]);
  const [amigos, setAmigos] = useState([]);
  const [cargandoAmigos, setCargandoAmigos] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [elegidos, setElegidos] = useState([]);
  const [ocultarLikes, setOcultarLikes] = useState(false);
  const [comentariosActivados, setComentariosActivados] = useState(true);
  const [publicando, setPublicando] = useState(false);

  // URL de preview por archivo (se liberan al cambiar la lista)
  const previews = useMemo(() => fotos.map((f) => URL.createObjectURL(f)), [fotos]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    if (!usuarioActual?.id_usuario) return;
    let cancelado = false;
    amistadService
      .listarAmigos(usuarioActual.id_usuario)
      .then((datos) => !cancelado && setAmigos(datos || []))
      .catch((error) => console.error("Error cargando amigos:", error))
      .finally(() => !cancelado && setCargandoAmigos(false));
    // El concierto se elige entre los que se unió, el más reciente primero
    conciertosService
      .listarMisEventos()
      .then(
        (datos) =>
          !cancelado &&
          setConciertos(
            [...(datos || [])].sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")))
          )
      )
      .catch((error) => console.error("Error cargando conciertos:", error));
    return () => {
      cancelado = true;
    };
  }, [usuarioActual?.id_usuario]);

  useEffect(() => {
    function manejarTecla(e) {
      if (e.key === "Escape" && !publicando) onCancelar();
    }
    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [publicando, onCancelar]);

  const indice = Math.min(actual, fotos.length - 1);
  const texto = busqueda.trim().toLowerCase();
  const visibles = amigos.filter(
    (amigo) =>
      !texto ||
      amigo.nombre?.toLowerCase().includes(texto) ||
      amigo.apodo?.toLowerCase().includes(texto)
  );
  const lleno = elegidos.length >= MAX_ETIQUETADOS;

  function alternar(idUsuario) {
    setElegidos((actuales) =>
      actuales.includes(idUsuario)
        ? actuales.filter((id) => id !== idUsuario)
        : lleno
          ? actuales
          : [...actuales, idUsuario]
    );
  }

  function mover(desde, hacia) {
    if (hacia < 0 || hacia >= fotos.length) return;
    setFotos((lista) => {
      const nueva = [...lista];
      const [foto] = nueva.splice(desde, 1);
      nueva.splice(hacia, 0, foto);
      return nueva;
    });
    setActual(hacia);
  }

  function sacar(posicion) {
    if (fotos.length === 1) {
      onCancelar();
      return;
    }
    setFotos((lista) => lista.filter((_, i) => i !== posicion));
    setActual((a) => Math.max(0, Math.min(a, fotos.length - 2)));
  }

  function agregarFotos(e) {
    const nuevas = [...(e.target.files || [])];
    e.target.value = "";
    const lugar = MAX_FOTOS - fotos.length;
    if (nuevas.length > lugar) {
      mostrarAviso(`Un momento puede tener hasta ${MAX_FOTOS} fotos.`, "info");
    }
    setFotos((lista) => [...lista, ...nuevas.slice(0, lugar)]);
  }

  async function publicar() {
    setPublicando(true);
    try {
      await momentosService.publicar({
        fotos,
        descripcion: descripcion.trim(),
        idConcierto: idConcierto || null,
        etiquetados: elegidos,
        comentariosActivados,
        ocultarLikes,
      });
    } catch (error) {
      setPublicando(false);
      mostrarAviso("No se pudo publicar: " + error.message);
      return;
    }
    setPublicando(false);
    onPublicado(elegidos.length);
  }

  return (
    <div className="nuevoMomentoFondo" role="dialog" aria-modal="true" aria-labelledby="nuevo-momento-titulo">
      <div className="nuevoMomentoCaja">
        <header className="nuevoMomentoHeader">
          <h2 id="nuevo-momento-titulo">Nuevo momento</h2>
          <button
            type="button"
            className="nuevoMomentoCerrar"
            onClick={onCancelar}
            disabled={publicando}
            aria-label="Cancelar"
          >
            <IconoCerrar />
          </button>
        </header>

        <div className="nuevoMomentoCuerpo">
          {/* ── Fotos ── */}
          <section className="nuevoMomentoFotos" aria-label="Fotos">
            <div className="nuevoMomentoVisor">
              <img src={previews[indice]} alt={`Foto ${indice + 1} de ${fotos.length}`} />

              {fotos.length > 1 && (
                <>
                  <span className="nuevoMomentoContador">
                    {indice + 1}/{fotos.length}
                  </span>
                  {indice > 0 && (
                    <button
                      type="button"
                      className="nuevoMomentoVisorNav nuevoMomentoVisorNav--prev"
                      onClick={() => setActual(indice - 1)}
                      aria-label="Foto anterior"
                    >
                      <IconoAnterior />
                    </button>
                  )}
                  {indice < fotos.length - 1 && (
                    <button
                      type="button"
                      className="nuevoMomentoVisorNav nuevoMomentoVisorNav--next"
                      onClick={() => setActual(indice + 1)}
                      aria-label="Foto siguiente"
                    >
                      <IconoSiguiente />
                    </button>
                  )}
                </>
              )}
            </div>

            <ol className="nuevoMomentoMiniaturas">
              {previews.map((url, i) => (
                <li key={url} className={i === indice ? "activa" : ""}>
                  <button type="button" onClick={() => setActual(i)} aria-label={`Ver foto ${i + 1}`}>
                    <img src={url} alt="" />
                  </button>
                  {i === indice && (
                    <span className="nuevoMomentoMiniaturaAcciones">
                      <button type="button" onClick={() => mover(i, i - 1)} disabled={i === 0} aria-label="Mover antes">
                        ‹
                      </button>
                      <button type="button" onClick={() => sacar(i)} aria-label="Sacar esta foto">
                        ×
                      </button>
                      <button
                        type="button"
                        onClick={() => mover(i, i + 1)}
                        disabled={i === fotos.length - 1}
                        aria-label="Mover después"
                      >
                        ›
                      </button>
                    </span>
                  )}
                </li>
              ))}
              {fotos.length < MAX_FOTOS && (
                <li>
                  <button
                    type="button"
                    className="nuevoMomentoAgregarFoto"
                    onClick={() => inputMasFotosRef.current?.click()}
                    aria-label="Agregar más fotos"
                  >
                    +
                  </button>
                  <input
                    ref={inputMasFotosRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={agregarFotos}
                  />
                </li>
              )}
            </ol>
          </section>

          {/* ── Datos del post ── */}
          <section className="nuevoMomentoDatos">
            <div className="nuevoMomentoCampo">
              <label htmlFor="momento-descripcion">Pie de foto</label>
              <textarea
                id="momento-descripcion"
                rows={4}
                maxLength={MAX_DESCRIPCION}
                placeholder="¿Cómo estuvo? Contá el momento…"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              <span className="nuevoMomentoContadorTexto">
                {descripcion.length}/{MAX_DESCRIPCION}
              </span>
            </div>

            <div className="nuevoMomentoCampo">
              <label htmlFor="momento-concierto">Concierto</label>
              <select
                id="momento-concierto"
                value={idConcierto}
                onChange={(e) => setIdConcierto(e.target.value)}
              >
                <option value="">Sin concierto</option>
                {conciertos.map((c) => (
                  <option key={c.id_concierto} value={c.id_concierto}>
                    {c.nombre || c.artista?.nombre}
                    {c.fecha ? ` · ${formatearFechaLarga(c.fecha)}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="nuevoMomentoCampo">
              <div className="nuevoMomentoEtiquetasHeader">
                <label htmlFor="momento-buscar-amigos">Etiquetar amigos</label>
                <span className="nuevoMomentoCantidad">
                  {elegidos.length}/{MAX_ETIQUETADOS}
                </span>
              </div>
              <p className="nuevoMomentoAyuda">
                Les llega una invitación y, si aceptan, el momento aparece también en su perfil.
              </p>

              {amigos.length > 5 && (
                <label className="nuevoMomentoBuscador">
                  <IconoBuscar />
                  <input
                    id="momento-buscar-amigos"
                    type="search"
                    placeholder="Buscar amigos"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </label>
              )}

              {cargandoAmigos && <p className="nuevoMomentoAyuda">Cargando amigos…</p>}
              {!cargandoAmigos && amigos.length === 0 && (
                <p className="nuevoMomentoAyuda">Todavía no tenés amigos para etiquetar.</p>
              )}

              <ul className="nuevoMomentoAmigos">
                {visibles.map((amigo) => {
                  const elegido = elegidos.includes(amigo.id_usuario);
                  return (
                    <li key={amigo.id_usuario}>
                      <label className={`nuevoMomentoAmigo ${elegido ? "nuevoMomentoAmigo--elegido" : ""}`}>
                        <input
                          type="checkbox"
                          checked={elegido}
                          disabled={!elegido && lleno}
                          onChange={() => alternar(amigo.id_usuario)}
                        />
                        <img src={amigo.fotoperfil || amigo.foto_perfil} alt="" />
                        <span className="nuevoMomentoAmigoNombre">
                          <strong>{amigo.apodo || amigo.nombre}</strong>
                          <small>@{amigo.nombre}</small>
                        </span>
                        <span className="nuevoMomentoCheck" aria-hidden="true" />
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <details className="nuevoMomentoAvanzado">
              <summary>Configuración avanzada</summary>
              <label className="nuevoMomentoInterruptor">
                <span>
                  <strong>Ocultar la cantidad de me gusta</strong>
                  <small>Solo vos y quienes compartan el momento la ven.</small>
                </span>
                <input type="checkbox" checked={ocultarLikes} onChange={(e) => setOcultarLikes(e.target.checked)} />
              </label>
              <label className="nuevoMomentoInterruptor">
                <span>
                  <strong>Desactivar comentarios</strong>
                  <small>Lo podés cambiar después desde el momento.</small>
                </span>
                <input
                  type="checkbox"
                  checked={!comentariosActivados}
                  onChange={(e) => setComentariosActivados(!e.target.checked)}
                />
              </label>
            </details>
          </section>
        </div>

        <footer className="nuevoMomentoAcciones">
          <button type="button" className="fmBotonPrimario" onClick={publicar} disabled={publicando}>
            {publicando
              ? "Publicando…"
              : elegidos.length > 0
                ? `Publicar con ${elegidos.length} ${elegidos.length === 1 ? "amigo" : "amigos"}`
                : "Publicar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
