import { useState } from "react";
import { plural } from "../utilidades";

// Pegar una lista (conciertos o grupos), revisarla y crear solo las filas
// válidas. La validación la hace el backend: cada fila vuelve con sus
// errores. `columnas` son las celdas propias de la vista previa
// ({ titulo, celda: (fila) => contenido }); Fila y Estado van siempre.
function TablaPrevia({ filas, columnas }) {
  return (
    <div className="tablaScroll">
      <table className="tabla">
        <thead>
          <tr>
            <th>Fila</th>
            {columnas.map((c, i) => (
              <th key={i}>{c.titulo}</th>
            ))}
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.fila} className={f.errores.length > 0 ? "filaConError" : undefined}>
              <td>{f.fila}</td>
              {columnas.map((c, i) => (
                <td key={i}>{c.celda(f)}</td>
              ))}
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

export default function ImportarLista({
  titulo,
  ayuda,
  etiqueta,
  ejemplo,
  singular,
  varios,
  columnas,
  revisarLista,
  importarLista,
  resumen,
  onListo,
  onCancelar,
}) {
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
      const { filas } = await revisarLista(texto);
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
      onListo(resumen(await importarLista(texto)));
    } catch (err) {
      setError(err.message);
      setTrabajando("");
    }
  }

  return (
    <div className="tarjeta formulario">
      <h2>{titulo}</h2>
      <p className="textoSuave">{ayuda}</p>
      <label>
        {etiqueta}
        <textarea
          className="textoImportar"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={ejemplo}
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
          <TablaPrevia filas={filasVisibles} columnas={columnas} />
        </>
      )}

      {error && <p className="mensajeError">{error}</p>}
      <div className="acciones">
        {vigente && validas > 0 ? (
          <button className="boton botonPrincipal" type="button" onClick={crear} disabled={Boolean(trabajando)}>
            {trabajando === "creando" ? "Creando…" : `Crear ${plural(validas, singular, varios)}`}
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
