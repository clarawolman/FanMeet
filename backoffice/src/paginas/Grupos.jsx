import { useState } from "react";
import { api } from "../api";
import { Cargando, Conversacion } from "../componentes";
import { fechaCorta, ordenarPorNombre, useCarga } from "../utilidades";

const CATEGORIAS = { pre: "Previa", after: "After", mismo_dia: "Mismo día" };

function MensajesDelGrupo({ idGrupo }) {
  const { datos, error, cargando } = useCarga(() => api.mensajesDeGrupo(idGrupo), [idGrupo]);
  return (
    <Cargando error={error} cargando={cargando}>
      {datos && <Conversacion mensajes={datos.mensajes} />}
    </Cargando>
  );
}

const VACIO = { id_concierto: "", nombre: "", categoria: "", fecha: "", hora: "", ubicacion: "", descripcion: "", foto: "" };

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
        const original = aFormulario(grupo);
        const cambios = Object.fromEntries(Object.entries(form).filter(([k, v]) => v !== original[k]));
        if (Object.keys(cambios).length === 0) {
          onListo("No cambiaste nada.");
          return;
        }
        await api.actualizarGrupo(grupo.id_grupo, cambios);
        onListo(`Grupo "${form.nombre.trim()}" actualizado.`);
      } else {
        await api.crearGrupo(form);
        onListo(`Grupo "${form.nombre.trim()}" creado.`);
      }
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

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

export default function Grupos() {
  const { datos, error, cargando, recargar } = useCarga(() => api.grupos(), []);
  const conciertos = useCarga(() => api.conciertos(), []);
  const [abierto, setAbierto] = useState(null);
  // null = sin formulario, { grupo: null } = nuevo, { grupo } = editar.
  const [formulario, setFormulario] = useState(null);
  const [mensaje, setMensaje] = useState("");

  function abrirFormulario(grupo) {
    setMensaje("");
    setFormulario({ grupo });
  }

  function terminar(texto) {
    setFormulario(null);
    setMensaje(texto);
    recargar();
  }

  return (
    <>
      <div className="tituloConAccion">
        <h1>Grupos</h1>
        {!formulario && (
          <button className="boton botonPrincipal" type="button" onClick={() => abrirFormulario(null)}>
            + Nuevo grupo
          </button>
        )}
      </div>

      {mensaje && <p className="mensajeOk">{mensaje}</p>}

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

      <Cargando error={error} cargando={cargando}>
        {abierto && (
          <section className="tarjeta">
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
                  <td>{g.concierto}</td>
                  <td>{CATEGORIAS[g.categoria] || g.categoria}</td>
                  <td>{fechaCorta(`${g.fecha}T${g.hora || "00:00"}`)}</td>
                  <td>{g.cantidadIntegrantes}</td>
                  <td>{g.cantidadMensajes}</td>
                  <td className="accionesFila">
                    {/* stopPropagation: la fila abre el chat. */}
                    <button className="botonTexto" type="button" onClick={(e) => { e.stopPropagation(); abrirFormulario(g); }}>
                      Editar
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
