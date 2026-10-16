import { useState } from "react";
import { api } from "../api";
import { Cargando, Conversacion } from "../componentes";
import { fechaCorta, useCarga } from "../utilidades";

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

function FormularioGrupo({ conciertos, onListo, onCancelar }) {
  const [form, setForm] = useState(VACIO);
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
      await api.crearGrupo(form);
      onListo(`Grupo "${form.nombre.trim()}" creado.`);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  return (
    <form className="tarjeta formulario" onSubmit={manejarEnviar}>
      <h2>Nuevo grupo</h2>
      <div className="camposGrilla">
        <label>
          Concierto
          <select value={form.id_concierto} onChange={elegirConcierto} required>
            <option value="">Elegí…</option>
            {conciertos.map((c) => (
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
          {guardando ? "Creando…" : "Crear grupo"}
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
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function terminar(texto) {
    setCreando(false);
    setMensaje(texto);
    recargar();
  }

  return (
    <>
      <div className="tituloConAccion">
        <h1>Grupos</h1>
        {!creando && (
          <button className="boton botonPrincipal" type="button" onClick={() => { setMensaje(""); setCreando(true); }}>
            + Nuevo grupo
          </button>
        )}
      </div>

      {mensaje && <p className="mensajeOk">{mensaje}</p>}

      {creando && (
        <Cargando error={conciertos.error} cargando={conciertos.cargando}>
          <FormularioGrupo conciertos={conciertos.datos || []} onListo={terminar} onCancelar={() => setCreando(false)} />
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cargando>
    </>
  );
}
