import { useState } from "react";
import { api } from "../api";
import { fechaCorta } from "../utilidades";

const EJEMPLO = [
  "Nombre\tArtista\tEstadio\tGénero\tFecha y hora\tImagen",
  "Fifty Something\tRush\tMovistar Arena\trock\t15/01/2027 21:00\thttps://…/imagen.jpg",
].join("\n");

function plural(cantidad, singular, varios) {
  return `${cantidad} ${cantidad === 1 ? singular : varios}`;
}

function resumen({ creados, conErrores, fallidos, notificados }) {
  const partes = [`Se ${creados.length === 1 ? "creó" : "crearon"} ${plural(creados.length, "concierto", "conciertos")}.`];
  if (notificados > 0) partes.push(`Se avisó a ${plural(notificados, "seguidor", "seguidores")}.`);
  if (conErrores.length > 0) {
    partes.push(
      `No se ${conErrores.length === 1 ? "creó la fila" : "crearon las filas"} ${conErrores.map((f) => f.fila).join(", ")} porque ${conErrores.length === 1 ? "tenía" : "tenían"} errores.`
    );
  }
  for (const f of fallidos) partes.push(`Fila ${f.fila} (${f.nombre}): ${f.error}.`);
  return partes.join(" ");
}

function TablaPrevia({ filas }) {
  return (
    <div className="tablaScroll">
      <table className="tabla">
        <thead>
          <tr>
            <th>Fila</th>
            <th></th>
            <th>Show</th>
            <th>Estadio</th>
            <th>Género</th>
            <th>Fecha</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.fila} className={f.errores.length > 0 ? "filaConError" : undefined}>
              <td>{f.fila}</td>
              <td>{f.imagen && <img className="miniatura" src={f.imagen} alt="" />}</td>
              <td>
                <strong>{f.nombre || "—"}</strong>
                <div className="textoSuave">{f.artista || "—"}</div>
              </td>
              <td>{f.estadio || "—"}</td>
              <td>{f.genero || "—"}</td>
              <td>{/^\d{4}-\d{2}-\d{2}T/.test(f.fecha) ? fechaCorta(f.fecha) : f.fecha || "—"}</td>
              <td>
                {f.errores.length === 0 ? (
                  <span className="estado estado-activo">Lista</span>
                ) : (
                  <ul className="erroresFila">
                    {f.errores.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Pegar una lista de conciertos, revisarla y crear solo las filas válidas.
// La validación la hace el backend: estadio y género tienen que existir,
// fecha futura, imagen que cargue y que el concierto no esté repetido.
export default function ImportarConciertos({ onListo, onCancelar }) {
  const [texto, setTexto] = useState("");
  // { texto, filas }: la vista previa vale solo para el texto que se revisó.
  const [previa, setPrevia] = useState(null);
  const [soloErrores, setSoloErrores] = useState(false);
  const [trabajando, setTrabajando] = useState("");
  const [error, setError] = useState("");

  const vigente = previa && previa.texto === texto;
  const validas = vigente ? previa.filas.filter((f) => f.errores.length === 0).length : 0;
  const conErrores = vigente ? previa.filas.length - validas : 0;
  const filasVisibles = vigente ? previa.filas.filter((f) => !soloErrores || f.errores.length > 0) : [];

  async function revisar() {
    setTrabajando("revisando");
    setError("");
    try {
      const { filas } = await api.previaImportacion(texto);
      setPrevia({ texto, filas });
      setSoloErrores(false);
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
      onListo(resumen(await api.importarConciertos(texto)));
    } catch (err) {
      setError(err.message);
      setTrabajando("");
    }
  }

  return (
    <div className="tarjeta formulario">
      <h2>Importar conciertos</h2>
      <p className="textoSuave">
        Pegá una tabla copiada de una planilla, un CSV o una tabla Markdown con: nombre, artista, estadio, género, fecha
        y hora, e imagen (URL). Con encabezado, las columnas pueden ir en cualquier orden. Los estadios y géneros tienen
        que existir en la base.
      </p>
      <label>
        Lista de conciertos
        <textarea
          className="textoImportar"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={EJEMPLO}
          spellCheck={false}
        />
      </label>

      {previa && !vigente && <p className="textoSuave">Cambiaste la lista: revisala de nuevo antes de crear.</p>}

      {vigente && (
        <>
          <div className="tituloConAccion">
            <p className="resumenPrevia">
              <strong>{plural(validas, "lista para crear", "listas para crear")}</strong>
              {conErrores > 0 && <span className="textoError"> · {conErrores} con errores</span>}
            </p>
            {conErrores > 0 && (
              <div className="pestanas">
                <button type="button" className={soloErrores ? "" : "activo"} onClick={() => setSoloErrores(false)}>
                  Todas
                </button>
                <button type="button" className={soloErrores ? "activo" : ""} onClick={() => setSoloErrores(true)}>
                  Con errores
                </button>
              </div>
            )}
          </div>
          <TablaPrevia filas={filasVisibles} />
        </>
      )}

      {error && <p className="mensajeError">{error}</p>}
      <div className="acciones">
        {vigente && validas > 0 ? (
          <button className="boton botonPrincipal" type="button" onClick={crear} disabled={Boolean(trabajando)}>
            {trabajando === "creando" ? "Creando…" : `Crear ${plural(validas, "concierto", "conciertos")}`}
          </button>
        ) : (
          <button
            className="boton botonPrincipal"
            type="button"
            onClick={revisar}
            disabled={Boolean(trabajando) || !texto.trim() || vigente}
          >
            {trabajando === "revisando" ? "Revisando…" : "Revisar"}
          </button>
        )}
        <button className="boton" type="button" onClick={onCancelar} disabled={Boolean(trabajando)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
