import { api } from "../api";
import { fechaCorta, plural } from "../utilidades";
import ImportarLista from "./ImportarLista";

const EJEMPLO = [
  "Nombre\tArtista\tEstadio\tGénero\tFecha y hora\tImagen",
  "Fifty Something\tRush\tMovistar Arena\trock\t15/01/2027 21:00\thttps://…/imagen.jpg",
].join("\n");

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

const COLUMNAS = [
  { titulo: "", celda: (f) => f.imagen && <img className="miniatura" src={f.imagen} alt="" /> },
  {
    titulo: "Show",
    celda: (f) => (
      <>
        <strong>{f.nombre || "—"}</strong>
        <div className="textoSuave">{f.artista || "—"}</div>
      </>
    ),
  },
  { titulo: "Estadio", celda: (f) => f.estadio || "—" },
  { titulo: "Género", celda: (f) => f.genero || "—" },
  { titulo: "Fecha", celda: (f) => (/^\d{4}-\d{2}-\d{2}T/.test(f.fecha) ? fechaCorta(f.fecha) : f.fecha || "—") },
];

export default function ImportarConciertos({ onListo, onCancelar }) {
  return (
    <ImportarLista
      titulo="Importar conciertos"
      ayuda="Pegá una tabla copiada de una planilla, un CSV o una tabla Markdown con: nombre, artista, estadio, género, fecha y hora, e imagen (URL). Con encabezado, las columnas pueden ir en cualquier orden. Los estadios y géneros tienen que existir en la base."
      etiqueta="Lista de conciertos"
      ejemplo={EJEMPLO}
      singular="concierto"
      varios="conciertos"
      columnas={COLUMNAS}
      revisarLista={api.previaImportacion}
      importarLista={api.importarConciertos}
      resumen={resumen}
      onListo={onListo}
      onCancelar={onCancelar}
    />
  );
}
