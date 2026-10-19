import { useEffect, useState } from "react";
import { api } from "../api";
import { Cargando } from "../componentes";
import { fechaCorta, ordenarPorNombre, useCarga } from "../utilidades";

const VACIO = {
  nombre: "",
  artista: "",
  artista_spotify_id: null,
  id_estadio: "",
  id_estiloMusical: "",
  fecha: "",
  imagenConcierto: "",
};

// "2026-10-16": no se puede elegir un día anterior (el backend también lo
// rechaza, ver backend/src/helpers/fechas.js).
function hoyEnArgentina() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}

function aFormulario(c) {
  return {
    nombre: c.nombre || "",
    artista: c.artista?.nombre || "",
    artista_spotify_id: c.artista?.spotify_id || null,
    id_estadio: String(c.id_estadio || ""),
    id_estiloMusical: String(c.id_estiloMusical || ""),
    // <input type="datetime-local"> quiere "2026-08-28T21:00"
    fecha: c.fecha ? String(c.fecha).slice(0, 16) : "",
    imagenConcierto: c.imagenConcierto || "",
  };
}

// Texto que explica a cuántos fans les llegó el aviso.
function textoAviso(aviso) {
  if (!aviso) return "";
  if (aviso.notificados > 0) return `Se avisó a ${aviso.notificados} fans unidos.`;
  if (aviso.unidos === undefined) return "No hubo cambios para avisar.";
  return `No se avisó a nadie: tiene ${aviso.unidos} fans unidos y el mínimo para avisar es ${aviso.minimo}.`;
}

// Artista buscado en Spotify: con el id se avisa a los que lo siguen desde
// su perfil. Si Spotify no lo tiene, queda el nombre escrito a mano.
function CampoArtista({ nombre, spotifyId, onCambiar }) {
  const [busqueda, setBusqueda] = useState({ texto: "", artistas: [] });
  const texto = nombre.trim();
  const buscar = !spotifyId && texto.length >= 2;

  useEffect(() => {
    if (!buscar) return undefined;
    let activo = true;
    const espera = setTimeout(async () => {
      try {
        const artistas = await api.buscarArtistas(texto);
        if (activo) setBusqueda({ texto, artistas });
      } catch {
        // Sin Spotify igual se puede escribir el nombre.
        if (activo) setBusqueda({ texto, artistas: [] });
      }
    }, 300);
    return () => {
      activo = false;
      clearTimeout(espera);
    };
  }, [buscar, texto]);

  const resultados = buscar && busqueda.texto === texto ? busqueda.artistas : [];

  return (
    <div>
      <label>
        Artista
        <input
          value={nombre}
          onChange={(e) => onCambiar(e.target.value, null)}
          required
          maxLength={150}
          autoComplete="off"
        />
        <small className="textoSuave">
          {spotifyId
            ? "✓ Vinculado con Spotify: se avisa a los que lo siguen."
            : "Elegilo de la lista de Spotify para avisarles a sus seguidores."}
        </small>
      </label>
      {resultados.length > 0 && (
        <ul className="resultadosArtista">
          {resultados.map((a) => (
            <li key={a.spotify_id}>
              <button type="button" className="conAvatar" onClick={() => onCambiar(a.nombre, a.spotify_id)}>
                {a.imagen ? <img className="avatar" src={a.imagen} alt="" /> : <span className="avatar" />}
                {a.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormularioConcierto({ concierto, catalogo, onListo, onCancelar }) {
  const editando = Boolean(concierto);
  const [form, setForm] = useState(editando ? aFormulario(concierto) : VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  // Un concierto que ya pasó se puede editar sin tocar la fecha (solo se
  // mandan los campos que cambiaron).
  const fechaSinCambios = editando && form.fecha === aFormulario(concierto).fecha;

  function cambiar(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  async function manejarEnviar(e) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      if (editando) {
        // Solo se mandan los campos que cambiaron.
        const original = aFormulario(concierto);
        const cambios = Object.fromEntries(Object.entries(form).filter(([k, v]) => v !== original[k]));
        // El id de Spotify solo tiene sentido junto al nombre del artista.
        if ("artista_spotify_id" in cambios) cambios.artista = form.artista;
        if (Object.keys(cambios).length === 0) {
          onListo("No cambiaste nada.");
          return;
        }
        const resultado = await api.editarConcierto(concierto.id_concierto, cambios);
        onListo(`Concierto actualizado. ${textoAviso(resultado.aviso)}`);
      } else {
        await api.crearConcierto(form);
        onListo("Concierto creado.");
      }
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  return (
    <form className="tarjeta formulario" onSubmit={manejarEnviar}>
      <h2>{editando ? `Editar "${concierto.nombre}"` : "Nuevo concierto"}</h2>
      <div className="camposGrilla">
        <label>
          Nombre del show
          <input value={form.nombre} onChange={cambiar("nombre")} required maxLength={150} />
        </label>
        <CampoArtista
          nombre={form.artista}
          spotifyId={form.artista_spotify_id}
          onCambiar={(artista, artista_spotify_id) => setForm((f) => ({ ...f, artista, artista_spotify_id }))}
        />
        <label>
          Estadio
          <select value={form.id_estadio} onChange={cambiar("id_estadio")} required>
            <option value="">Elegí…</option>
            {ordenarPorNombre(catalogo.estadios).map((e) => (
              <option key={e.id_estadio} value={e.id_estadio}>
                {e.nombre} ({e.ciudad})
              </option>
            ))}
          </select>
        </label>
        <label>
          Género
          <select value={form.id_estiloMusical} onChange={cambiar("id_estiloMusical")} required>
            <option value="">Elegí…</option>
            {ordenarPorNombre(catalogo.estilos).map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha y hora
          <input type="datetime-local" value={form.fecha} onChange={cambiar("fecha")} min={fechaSinCambios ? undefined : `${hoyEnArgentina()}T00:00`} required />
        </label>
        <label>
          Imagen (URL)
          <input type="url" value={form.imagenConcierto} onChange={cambiar("imagenConcierto")} required placeholder="https://…" />
        </label>
      </div>
      {form.imagenConcierto && <img className="vistaPrevia" src={form.imagenConcierto} alt="Vista previa" />}
      {editando && (
        <p className="textoSuave">
          Si el concierto tiene muchos fans unidos, les llega una notificación avisando qué cambió.
        </p>
      )}
      {error && <p className="mensajeError">{error}</p>}
      <div className="acciones">
        <button className="boton botonPrincipal" type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear concierto"}
        </button>
        <button className="boton" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function FormularioNovedad({ concierto, onListo, onCancelar }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function manejarEnviar(e) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const { aviso } = await api.publicarNovedad(concierto.id_concierto, titulo.trim(), descripcion.trim());
      onListo(textoAviso(aviso));
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  return (
    <form className="tarjeta formulario" onSubmit={manejarEnviar}>
      <h2>Novedad para los fans de "{concierto.nombre}"</h2>
      <p className="textoSuave">
        Les llega como notificación a todos los fans unidos ({concierto.cantidadFans}), si son suficientes.
      </p>
      <label>
        Título
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={100} placeholder="Ej: Se abren las puertas a las 18" />
      </label>
      <label>
        Detalle
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required maxLength={500} />
      </label>
      {error && <p className="mensajeError">{error}</p>}
      <div className="acciones">
        <button className="boton botonPrincipal" type="submit" disabled={guardando}>
          {guardando ? "Enviando…" : "Publicar novedad"}
        </button>
        <button className="boton" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ConfirmarEliminar({ concierto, onListo, onCancelar }) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  async function eliminar() {
    setEliminando(true);
    setError("");
    try {
      const { notificados } = await api.eliminarConcierto(concierto.id_concierto);
      onListo(
        `Se eliminó "${concierto.nombre}".` +
          (notificados > 0 ? ` Se avisó a ${notificados} fans unidos.` : "")
      );
    } catch (err) {
      setError(err.message);
      setEliminando(false);
    }
  }

  return (
    <div className="tarjeta formulario">
      <h2>¿Eliminar "{concierto.nombre}"?</h2>
      <p>
        Se borran también sus {concierto.cantidadGrupos} grupos (con sus chats) y se desune a sus{" "}
        {concierto.cantidadFans} fans, que reciben un aviso de que se canceló. No se puede deshacer.
      </p>
      {error && <p className="mensajeError">{error}</p>}
      <div className="acciones">
        <button className="boton botonPeligro" type="button" onClick={eliminar} disabled={eliminando}>
          {eliminando ? "Eliminando…" : "Eliminar definitivamente"}
        </button>
        <button className="boton" type="button" onClick={onCancelar} disabled={eliminando}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function TablaConciertos({ conciertos, onAbrir }) {
  return (
    <div className="tablaScroll">
      <table className="tabla">
        <thead>
          <tr>
            <th></th>
            <th>Show</th>
            <th>Fecha</th>
            <th>Estadio</th>
            <th>Fans</th>
            <th>Grupos</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {conciertos.map((c) => (
            <tr key={c.id_concierto}>
              <td>
                <img className="miniatura" src={c.imagen} alt="" />
              </td>
              <td>
                <strong>{c.nombre}</strong>
                <div className="textoSuave">{c.artista?.nombre}</div>
              </td>
              <td>{fechaCorta(c.fecha)}</td>
              <td>{c.estadio?.nombre}</td>
              <td>{c.cantidadFans}</td>
              <td>{c.cantidadGrupos}</td>
              <td className="accionesFila">
                <button className="botonTexto" type="button" onClick={() => onAbrir("editar", c)}>
                  Editar
                </button>
                <button className="botonTexto" type="button" onClick={() => onAbrir("novedad", c)}>
                  Novedad
                </button>
                <button className="botonTexto botonTextoPeligro" type="button" onClick={() => onAbrir("eliminar", c)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Mismo criterio que el backend (backend/src/helpers/fechas.js): un
// concierto sigue vigente todo el día del show. Próximos del más cercano al
// más lejano; los pasados del más reciente al más viejo.
function separarProximosYPasados(conciertos) {
  const hoy = hoyEnArgentina();
  const porFecha = [...conciertos].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  const yaPaso = (c) => Boolean(c.fecha) && String(c.fecha).slice(0, 10) < hoy;
  return {
    proximos: porFecha.filter((c) => !yaPaso(c)),
    pasados: porFecha.filter(yaPaso).reverse(),
  };
}

export default function Conciertos() {
  const conciertos = useCarga(() => api.conciertos(), []);
  const catalogo = useCarga(() => api.catalogo(), []);
  // { tipo: "nuevo" | "editar" | "novedad" | "eliminar", concierto? }
  const [abierto, setAbierto] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const { proximos, pasados } = separarProximosYPasados(conciertos.datos || []);

  function abrir(tipo, concierto) {
    setMensaje("");
    setAbierto({ tipo, concierto });
  }

  function terminar(texto) {
    setAbierto(null);
    setMensaje(texto);
    conciertos.recargar();
  }

  return (
    <>
      <div className="tituloConAccion">
        <h1>Conciertos</h1>
        {!abierto && (
          <button className="boton botonPrincipal" type="button" onClick={() => { setMensaje(""); setAbierto({ tipo: "nuevo" }); }}>
            + Nuevo concierto
          </button>
        )}
      </div>

      {mensaje && <p className="mensajeOk">{mensaje}</p>}

      {abierto?.tipo === "eliminar" && (
        <ConfirmarEliminar concierto={abierto.concierto} onListo={terminar} onCancelar={() => setAbierto(null)} />
      )}
      {abierto?.tipo === "novedad" && (
        <FormularioNovedad concierto={abierto.concierto} onListo={terminar} onCancelar={() => setAbierto(null)} />
      )}
      {(abierto?.tipo === "nuevo" || abierto?.tipo === "editar") && (
        <Cargando error={catalogo.error} cargando={catalogo.cargando}>
          <FormularioConcierto
            key={abierto.concierto?.id_concierto || "nuevo"}
            concierto={abierto.concierto}
            catalogo={catalogo.datos || { artistas: [], estadios: [], estilos: [] }}
            onListo={terminar}
            onCancelar={() => setAbierto(null)}
          />
        </Cargando>
      )}

      <Cargando error={conciertos.error} cargando={conciertos.cargando}>
        <h2 className="tituloSeccion">
          Próximos <span className="cantidadSeccion">{proximos.length}</span>
        </h2>
        {proximos.length > 0 ? (
          <TablaConciertos conciertos={proximos} onAbrir={abrir} />
        ) : (
          <p className="textoSuave">No hay conciertos próximos.</p>
        )}

        {pasados.length > 0 && (
          <>
            <h2 className="tituloSeccion">
              Ya pasaron <span className="cantidadSeccion">{pasados.length}</span>
            </h2>
            <TablaConciertos conciertos={pasados} onAbrir={abrir} />
          </>
        )}
      </Cargando>
    </>
  );
}
