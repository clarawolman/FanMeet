import { useState } from "react";
import { api } from "../api";
import { fechaCorta, ordenarPorNombre, plural } from "../utilidades";

// Grupos automáticos: unas plantillas (Previa, Estacionamiento, After...) que
// se aplican a todos los conciertos próximos de una vez. La fecha y la hora
// salen de las del concierto; el nombre y el lugar pueden usar {artista},
// {estadio}, {direccion} y {concierto}. Los grupos que ya existen (mismo
// nombre en el mismo concierto) no se duplican, así que se puede volver a
// correr cada vez que se suman conciertos nuevos.

const TIPOS = { pre: "Previa", mismo_dia: "Mismo día", after: "After" };

const PLANTILLAS_INICIALES = [
  {
    nombre: "Previa de {artista}",
    categoria: "pre",
    horas: "3",
    momento: "antes",
    ubicacion: "Puerta del {estadio}",
    descripcion: "Nos juntamos antes del show para conocernos y entrar juntos.",
  },
  {
    nombre: "Estacionamiento {estadio}",
    categoria: "mismo_dia",
    horas: "4",
    momento: "antes",
    ubicacion: "Estacionamiento del {estadio}",
    descripcion: "Para los que van en auto: coordinamos lugar y nos esperamos para entrar y salir juntos.",
  },
  {
    nombre: "After de {artista}",
    categoria: "after",
    horas: "3",
    momento: "despues",
    ubicacion: "Salida del {estadio}",
    descripcion: "Seguimos la noche después del show.",
  },
];

const CLAVE_GUARDADO = "fm-backoffice-plantillas-grupos";

// Las plantillas quedan guardadas en este navegador para la próxima vez.
function leerPlantillas() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE_GUARDADO));
    if (Array.isArray(guardadas) && guardadas.length > 0) return guardadas;
  } catch {
    // sin localStorage o con datos rotos: se usan las de siempre
  }
  return PLANTILLAS_INICIALES;
}

function guardarPlantillas(plantillas) {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(plantillas));
  } catch {
    // sin localStorage las plantillas valen solo para esta visita
  }
}

function aDatos(plantillas, idConcierto) {
  return {
    plantillas: plantillas.map(({ horas, momento, ...p }) => ({
      ...p,
      minutos: Math.round(Number(horas || 0) * 60) * (momento === "antes" ? -1 : 1),
    })),
    ...(idConcierto ? { ids_conciertos: [Number(idConcierto)] } : {}),
  };
}

function Plantilla({ plantilla, numero, onCambiar, onQuitar }) {
  const cambiar = (campo) => (e) => onCambiar({ ...plantilla, [campo]: e.target.value });
  return (
    <fieldset className="plantillaGrupo">
      <legend>
        Grupo {numero}
        {onQuitar && (
          <button className="botonTexto botonTextoPeligro" type="button" onClick={onQuitar}>
            Quitar
          </button>
        )}
      </legend>
      <div className="camposGrilla">
        <label>
          Nombre
          <input value={plantilla.nombre} onChange={cambiar("nombre")} required maxLength={100} />
        </label>
        <label>
          Tipo
          <select value={plantilla.categoria} onChange={cambiar("categoria")}>
            {Object.entries(TIPOS).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </label>
        <label>
          Horario (horas respecto del show)
          <span className="horarioPlantilla">
            <input
              type="number"
              min={0}
              max={48}
              step={0.5}
              value={plantilla.horas}
              onChange={cambiar("horas")}
              required
              aria-label="Horas"
            />
            <select value={plantilla.momento} onChange={cambiar("momento")} aria-label="Antes o después del show">
              <option value="antes">antes</option>
              <option value="despues">después</option>
            </select>
          </span>
        </label>
        <label>
          Punto de encuentro
          <input value={plantilla.ubicacion} onChange={cambiar("ubicacion")} required minLength={6} maxLength={150} />
        </label>
      </div>
      <label>
        Descripción (opcional)
        <textarea value={plantilla.descripcion} onChange={cambiar("descripcion")} maxLength={500} rows={2} />
      </label>
    </fieldset>
  );
}

function estadoFila(f) {
  if (f.existe) return <span className="estado estado-yaExiste">Ya existe</span>;
  if (f.error) return <span className="textoError">{f.error}</span>;
  return <span className="estado estado-activo">Se crea</span>;
}

export default function GruposAutomaticos({ conciertos, onListo, onCancelar }) {
  const [plantillas, setPlantillas] = useState(leerPlantillas);
  const [idConcierto, setIdConcierto] = useState("");
  // { clave, filas }: la vista previa vale solo para lo que se revisó.
  const [previa, setPrevia] = useState(null);
  const [trabajando, setTrabajando] = useState("");
  const [error, setError] = useState("");

  const datos = aDatos(plantillas, idConcierto);
  const clave = JSON.stringify(datos);
  const vigente = previa?.clave === clave;
  const aCrear = vigente ? previa.filas.filter((f) => !f.existe && !f.error).length : 0;

  function cambiarPlantilla(i, nueva) {
    setPlantillas((lista) => lista.map((p, j) => (j === i ? nueva : p)));
  }

  async function revisar(e) {
    e.preventDefault();
    setTrabajando("revisando");
    setError("");
    try {
      const { filas } = await api.previaGruposAutomaticos(datos);
      setPrevia({ clave, filas });
      guardarPlantillas(plantillas);
    } catch (err) {
      setError(err.message);
      setPrevia(null);
    } finally {
      setTrabajando("");
    }
  }

  async function crear() {
    setTrabajando("creando");
    setError("");
    try {
      const r = await api.crearGruposAutomaticos(datos);
      const partes = [`Se ${r.creados.length === 1 ? "creó" : "crearon"} ${plural(r.creados.length, "grupo", "grupos")}.`];
      if (r.yaExistian > 0) partes.push(`${plural(r.yaExistian, "ya existía", "ya existían")} y no se duplicaron.`);
      for (const f of r.fallidos) partes.push(`${f.nombre} (${f.concierto}): ${f.error}.`);
      onListo(partes.join(" "));
    } catch (err) {
      setError(err.message);
      setTrabajando("");
    }
  }

  const proximos = conciertos.filter((c) => c.fecha && String(c.fecha).slice(0, 10) >= new Date().toISOString().slice(0, 10));

  return (
    <form className="tarjeta formulario" onSubmit={revisar}>
      <h2>Grupos automáticos</h2>
      <p className="textoSuave">
        Estos grupos se crean en cada concierto, con la fecha y la hora calculadas desde el show. En el nombre, el
        punto de encuentro y la descripción podés usar {"{artista}"}, {"{estadio}"}, {"{direccion}"} y{" "}
        {"{concierto}"}. Si un concierto ya tiene un grupo con ese nombre, no se duplica: podés volver a correrlo cada
        vez que cargues conciertos nuevos.
      </p>

      <label>
        Conciertos
        <select value={idConcierto} onChange={(e) => setIdConcierto(e.target.value)}>
          <option value="">Todos los próximos ({proximos.length})</option>
          {ordenarPorNombre(proximos).map((c) => (
            <option key={c.id_concierto} value={c.id_concierto}>
              Solo {c.nombre} — {c.artista?.nombre} ({fechaCorta(c.fecha)})
            </option>
          ))}
        </select>
      </label>

      {plantillas.map((p, i) => (
        <Plantilla
          key={i}
          numero={i + 1}
          plantilla={p}
          onCambiar={(nueva) => cambiarPlantilla(i, nueva)}
          onQuitar={plantillas.length > 1 ? () => setPlantillas((lista) => lista.filter((_, j) => j !== i)) : null}
        />
      ))}
      <div className="acciones accionesPlantillas">
        {plantillas.length < 10 && (
          <button
            className="botonTexto"
            type="button"
            onClick={() =>
              setPlantillas((lista) => [
                ...lista,
                { nombre: "", categoria: "pre", horas: "2", momento: "antes", ubicacion: "", descripcion: "" },
              ])
            }
          >
            + Agregar otro grupo
          </button>
        )}
        <button className="botonTexto" type="button" onClick={() => setPlantillas(PLANTILLAS_INICIALES)}>
          Volver a los de siempre
        </button>
      </div>

      {previa && !vigente && <p className="textoSuave">Cambiaste algo: revisá de nuevo antes de crear.</p>}

      {vigente && (
        <>
          <p className="resumenPrevia">
            <strong>{plural(aCrear, "grupo para crear", "grupos para crear")}</strong>
            {previa.filas.length > aCrear && (
              <span className="textoSuave"> · {previa.filas.length - aCrear} se saltean</span>
            )}
          </p>
          {previa.filas.length === 0 ? (
            <p className="textoSuave">No hay conciertos próximos.</p>
          ) : (
            <div className="tablaScroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Concierto</th>
                    <th>Grupo</th>
                    <th>Tipo</th>
                    <th>Cuándo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {previa.filas.map((f, i) => (
                    <tr key={i} className={f.error && !f.existe ? "filaConError" : undefined}>
                      <td>
                        {f.concierto.nombre}
                        <div className="textoSuave">{f.concierto.artista}</div>
                      </td>
                      <td>
                        <strong>{f.nombre}</strong>
                        <div className="textoSuave">{f.ubicacion}</div>
                      </td>
                      <td>{TIPOS[f.categoria]}</td>
                      <td>{f.fecha ? fechaCorta(`${f.fecha}T${f.hora}`) : "—"}</td>
                      <td>{estadoFila(f)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {error && <p className="mensajeError">{error}</p>}
      <div className="acciones">
        {vigente && aCrear > 0 ? (
          <button className="boton botonPrincipal" type="button" onClick={crear} disabled={Boolean(trabajando)}>
            {trabajando === "creando" ? "Creando…" : `Crear ${plural(aCrear, "grupo", "grupos")}`}
          </button>
        ) : (
          <button className="boton botonPrincipal" type="submit" disabled={Boolean(trabajando) || vigente}>
            {trabajando === "revisando" ? "Revisando…" : "Ver qué se va a crear"}
          </button>
        )}
        <button className="boton" type="button" onClick={onCancelar} disabled={Boolean(trabajando)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
