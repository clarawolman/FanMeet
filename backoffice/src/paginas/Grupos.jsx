import { useState } from "react";
import { api } from "../api";
import { Cargando, Conversacion } from "../componentes";
import { fechaCorta, ordenarPorNombre, plural, useCarga, useMostrarAlAbrir } from "../utilidades";
import ImportarGrupos from "./ImportarGrupos";

// "comunidad" = sin encuentro (sin fecha, hora ni punto de encuentro).
const CATEGORIAS = { pre: "Previa", after: "After", mismo_dia: "Mismo día", comunidad: "Comunidad" };

function MensajesDelGrupo({ idGrupo }) {
  const { datos, error, cargando } = useCarga(() => api.mensajesDeGrupo(idGrupo), [idGrupo]);
  return (
    <Cargando error={error} cargando={cargando}>
      {datos && <Conversacion mensajes={datos.mensajes} />}
    </Cargando>
  );
}

// cupo "" = sin límite. todasLasFechas = grupo general de las fechas seguidas del concierto.
const VACIO = {
  id_concierto: "",
  nombre: "",
  categoria: "",
  fecha: "",
  hora: "",
  ubicacion: "",
  descripcion: "",
  foto: "",
  cupo: "",
  todasLasFechas: false,
};

function aFormulario(g) {
  return {
    id_concierto: String(g.id_concierto || ""),
    nombre: g.nombre || "",
    categoria: g.categoria || "",
    fecha: g.fecha ? String(g.fecha).slice(0, 10) : "",
    // <input type="time"> quiere "19:00", la base guarda "19:00:00".
    hora: g.hora ? String(g.hora).slice(0, 5) : "",
    ubicacion: g.ubicacion || "",
    descripcion: g.descripcion || "",
    foto: g.foto || "",
    cupo: g.cupo ? String(g.cupo) : "",
    todasLasFechas: (g.ids_conciertos?.length || 0) > 1,
  };
}

// Lo que se manda al backend: las fechas del grupo general como ids y, sin
// encuentro, sin fecha, hora ni lugar.
function aDatos(form, conciertos) {
  const { todasLasFechas, ...datos } = form;
  const concierto = conciertos.find((c) => String(c.id_concierto) === String(form.id_concierto));
  const fechas = todasLasFechas ? concierto?.fechasSeguidas || [] : [];
  return {
    ...datos,
    ids_conciertos: fechas.length > 1 ? fechas : [Number(form.id_concierto)],
    ...(form.categoria === "comunidad" ? { fecha: "", hora: "", ubicacion: "" } : {}),
  };
}

function FormularioGrupo({ grupo, conciertos, onListo, onCancelar }) {
  const editando = Boolean(grupo);
  const [form, setForm] = useState(editando ? aFormulario(grupo) : VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function cambiar(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  }

  // Al elegir el concierto se sugiere su fecha, que es lo más común.
  function elegirConcierto(e) {
    const id = e.target.value;
    const concierto = conciertos.find((c) => String(c.id_concierto) === id);
    setForm((f) => ({
      ...f,
      id_concierto: id,
      fecha: f.fecha || (concierto?.fecha ? String(concierto.fecha).slice(0, 10) : ""),
    }));
  }

  async function manejarEnviar(e) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      if (editando) {
        // Solo se mandan los campos que cambiaron.
        const original = aDatos(aFormulario(grupo), conciertos);
        const cambios = Object.fromEntries(
          Object.entries(aDatos(form, conciertos)).filter(
            ([k, v]) => JSON.stringify(v) !== JSON.stringify(original[k])
          )
        );
        if (Object.keys(cambios).length === 0) {
          onListo("No cambiaste nada.");
          return;
        }
        const { notificados } = await api.actualizarGrupo(grupo.id_grupo, cambios);
        onListo(
          `Grupo "${form.nombre.trim()}" actualizado.` +
            (notificados > 0 ? ` Se avisó a ${notificados} integrantes.` : "")
        );
      } else {
        await api.crearGrupo(aDatos(form, conciertos));
        onListo(`Grupo "${form.nombre.trim()}" creado.`);
      }
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  const sinEncuentro = form.categoria === "comunidad";
  const conciertoElegido = conciertos.find((c) => String(c.id_concierto) === form.id_concierto);
  const fechasSeguidas = conciertoElegido?.fechasSeguidas || [];

  return (
    <form className="tarjeta formulario" onSubmit={manejarEnviar}>
      <h2>{editando ? `Editar "${grupo.nombre}"` : "Nuevo grupo"}</h2>
      <div className="camposGrilla">
        <label>
          Concierto
          <select value={form.id_concierto} onChange={elegirConcierto} required>
            <option value="">Elegí…</option>
            {ordenarPorNombre(conciertos).map((c) => (
              <option key={c.id_concierto} value={c.id_concierto}>
                {c.nombre} — {c.artista?.nombre} ({fechaCorta(c.fecha)})
              </option>
            ))}
          </select>
        </label>
        <label>
          Nombre del grupo
          <input value={form.nombre} onChange={cambiar("nombre")} required maxLength={100} />
        </label>
        <label>
          Tipo
          <select value={form.categoria} onChange={cambiar("categoria")} required>
            <option value="">Elegí…</option>
            {Object.entries(CATEGORIAS).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </label>
        {fechasSeguidas.length > 1 && (
          <label>
            Fechas
            <select
              value={form.todasLasFechas ? "todas" : "una"}
              onChange={(e) => setForm((f) => ({ ...f, todasLasFechas: e.target.value === "todas" }))}
            >
              <option value="una">Solo este concierto</option>
              <option value="todas">Las {fechasSeguidas.length} fechas seguidas</option>
            </select>
          </label>
        )}
        {!sinEncuentro && (
          <>
            <label>
              Fecha
              <input type="date" value={form.fecha} onChange={cambiar("fecha")} required />
            </label>
            <label>
              Hora
              <input type="time" value={form.hora} onChange={cambiar("hora")} required />
            </label>
            <label>
              Punto de encuentro
              <input value={form.ubicacion} onChange={cambiar("ubicacion")} required minLength={6} maxLength={150} placeholder="Ej: Bar de la esquina del estadio" />
            </label>
          </>
        )}
        <label>
          Cupo (vacío = sin límite)
          <input type="number" min={2} max={500} value={form.cupo} onChange={cambiar("cupo")} placeholder="Sin límite" />
        </label>
        <label>
          Foto (URL, opcional)
          <input type="url" value={form.foto} onChange={cambiar("foto")} placeholder="https://…" />
        </label>
      </div>
      <label>
        Descripción (opcional)
        <textarea value={form.descripcion} onChange={cambiar("descripcion")} maxLength={500} />
      </label>
      {form.foto && <img className="vistaPrevia" src={form.foto} alt="Vista previa" />}
      {error && <p className="mensajeError">{error}</p>}
      <div className="acciones">
        <button className="boton botonPrincipal" type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear grupo"}
        </button>
        <button className="boton" type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ConfirmarEliminar({ grupo, onListo, onCancelar }) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  async function eliminar() {
    setEliminando(true);
    setError("");
    try {
      const { notificados } = await api.eliminarGrupo(grupo.id_grupo);
      onListo(
        `Se eliminó "${grupo.nombre}".` +
          (notificados > 0 ? ` Se avisó a ${plural(notificados, "integrante", "integrantes")}.` : "")
      );
    } catch (err) {
      setError(err.message);
      setEliminando(false);
    }
  }

  return (
    <div className="tarjeta formulario">
      <h2>¿Eliminar "{grupo.nombre}"?</h2>
      <p>
        Tiene {plural(grupo.cantidadIntegrantes, "integrante", "integrantes")} y{" "}
        {plural(grupo.cantidadMensajes, "mensaje", "mensajes")}. Se borra el grupo con su chat (también las fotos) y
        los integrantes reciben un aviso. No se puede deshacer.
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

export default function Grupos() {
  const { datos, error, cargando, recargar } = useCarga(() => api.grupos(), []);
  const conciertos = useCarga(() => api.conciertos(), []);
  const [abierto, setAbierto] = useState(null);
  // null = sin formulario, { grupo: null } = nuevo, { grupo } = editar.
  const [formulario, setFormulario] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [importando, setImportando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const refPanel = useMostrarAlAbrir(formulario || aEliminar || importando || mensaje);
  const refChat = useMostrarAlAbrir(abierto);

  function abrirFormulario(grupo) {
    setMensaje("");
    setAEliminar(null);
    setImportando(false);
    setFormulario({ grupo });
  }

  function abrirEliminar(grupo) {
    setMensaje("");
    setFormulario(null);
    setImportando(false);
    setAEliminar(grupo);
  }

  function abrirImportar() {
    setMensaje("");
    setFormulario(null);
    setAEliminar(null);
    setImportando(true);
  }

  function terminar(texto) {
    setFormulario(null);
    setImportando(false);
    setMensaje(texto);
    recargar();
  }

  function terminarEliminar(texto) {
    // Si estaba abierto el chat del grupo borrado, se cierra.
    setAbierto((chat) => (chat?.id_grupo === aEliminar.id_grupo ? null : chat));
    setAEliminar(null);
    terminar(texto);
  }

  return (
    <>
      <div className="tituloConAccion">
        <h1>Grupos</h1>
        {!formulario && !importando && (
          <div className="acciones">
            <button className="boton" type="button" onClick={abrirImportar}>
              Importar lista
            </button>
            <button className="boton botonPrincipal" type="button" onClick={() => abrirFormulario(null)}>
              + Nuevo grupo
            </button>
          </div>
        )}
      </div>

      <div ref={refPanel} className="anclaPanel">
      {mensaje && <p className="mensajeOk">{mensaje}</p>}

      {importando && <ImportarGrupos onListo={terminar} onCancelar={() => setImportando(false)} />}

      {aEliminar && (
        <ConfirmarEliminar grupo={aEliminar} onListo={terminarEliminar} onCancelar={() => setAEliminar(null)} />
      )}

      {formulario && (
        <Cargando error={conciertos.error} cargando={conciertos.cargando}>
          <FormularioGrupo
            key={formulario.grupo?.id_grupo || "nuevo"}
            grupo={formulario.grupo}
            conciertos={conciertos.datos || []}
            onListo={terminar}
            onCancelar={() => setFormulario(null)}
          />
        </Cargando>
      )}
      </div>

      <Cargando error={error} cargando={cargando}>
        {abierto && (
          <section ref={refChat} className="tarjeta anclaPanel">
            <div className="tituloConAccion">
              <h2>Chat de "{abierto.nombre}"</h2>
              <button className="botonTexto" type="button" onClick={() => setAbierto(null)}>
                Cerrar
              </button>
            </div>
            <MensajesDelGrupo idGrupo={abierto.id_grupo} />
          </section>
        )}

        <div className="tablaScroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Concierto</th>
                <th>Tipo</th>
                <th>Cuándo</th>
                <th>Integrantes</th>
                <th>Mensajes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {datos?.map((g) => (
                <tr key={g.id_grupo} className="filaClick" onClick={() => setAbierto(g)}>
                  <td>
                    <strong>{g.nombre}</strong>
                    {g.descripcion && <div className="textoSuave celdaTexto">{g.descripcion}</div>}
                  </td>
                  <td>
                    {g.concierto}
                    {g.cantidadFechas > 1 && <div className="textoSuave">{g.cantidadFechas} fechas</div>}
                  </td>
                  <td>{CATEGORIAS[g.categoria] || g.categoria}</td>
                  <td>{g.fecha ? fechaCorta(`${g.fecha}T${g.hora || "00:00"}`) : "Sin encuentro"}</td>
                  <td>{g.cupo ? `${g.cantidadIntegrantes} / ${g.cupo}` : g.cantidadIntegrantes}</td>
                  <td>{g.cantidadMensajes}</td>
                  <td className="accionesFila">
                    {/* stopPropagation: la fila abre el chat. */}
                    <button className="botonTexto" type="button" onClick={(e) => { e.stopPropagation(); abrirFormulario(g); }}>
                      Editar
                    </button>
                    <button className="botonTexto botonTextoPeligro" type="button" onClick={(e) => { e.stopPropagation(); abrirEliminar(g); }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cargando>
    </>
  );
}
