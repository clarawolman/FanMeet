import { useState } from "react";
import { api } from "../api";
import { Cargando } from "../componentes";
import { fechaCorta, useCarga } from "../utilidades";

const VACIO = { nombre: "", artista: "", id_estadio: "", id_estiloMusical: "", fecha: "", imagenConcierto: "" };

function aFormulario(c) {
  return {
    nombre: c.nombre || "",
    artista: c.artista?.nombre || "",
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

function FormularioConcierto({ concierto, catalogo, onListo, onCancelar }) {
  const editando = Boolean(concierto);
  const [form, setForm] = useState(editando ? aFormulario(concierto) : VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

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
        <label>
          Artista
          <input value={form.artista} onChange={cambiar("artista")} list="lista-artistas" required maxLength={150} />
          <datalist id="lista-artistas">
            {catalogo.artistas.map((a) => (
              <option key={a.id_artista} value={a.nombre} />
            ))}
          </datalist>
          <small className="textoSuave">Si no existe, se crea.</small>
        </label>
        <label>
          Estadio
          <select value={form.id_estadio} onChange={cambiar("id_estadio")} required>
            <option value="">Elegí…</option>
            {catalogo.estadios.map((e) => (
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
            {catalogo.estilos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha y hora
          <input type="datetime-local" value={form.fecha} onChange={cambiar("fecha")} required />
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

export default function Conciertos() {
  const conciertos = useCarga(() => api.conciertos(), []);
  const catalogo = useCarga(() => api.catalogo(), []);
  // { tipo: "nuevo" | "editar" | "novedad", concierto? }
  const [abierto, setAbierto] = useState(null);
  const [mensaje, setMensaje] = useState("");

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
              {conciertos.datos?.map((c) => (
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
                    <button className="botonTexto" type="button" onClick={() => { setMensaje(""); setAbierto({ tipo: "editar", concierto: c }); }}>
                      Editar
                    </button>
                    <button className="botonTexto" type="button" onClick={() => { setMensaje(""); setAbierto({ tipo: "novedad", concierto: c }); }}>
                      Novedad
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
