import { api } from "../api";
import { fechaCorta, plural } from "../utilidades";
import ImportarLista from "./ImportarLista";

const CATEGORIAS = { pre: "Previa", after: "After", mismo_dia: "Mismo día", comunidad: "Comunidad" };

const EJEMPLO = [
  "Nombre\tConcierto\tTipo\tFecha y hora\tPunto de encuentro\tCupo\tDescripción\tFoto",
  "Previa en Palermo\tFifty Something\tPrevia\t15/01/2027 18:00\tPlaza Italia\t20\tNos juntamos antes\thttps://…/foto.jpg",
].join("\n");

function resumen({ creados, conErrores, fallidos }) {
  const partes = [`Se ${creados.length === 1 ? "creó" : "crearon"} ${plural(creados.length, "grupo", "grupos")}.`];
  if (conErrores.length > 0) {
    partes.push(
      `No se ${conErrores.length === 1 ? "creó la fila" : "crearon las filas"} ${conErrores.map((f) => f.fila).join(", ")} porque ${conErrores.length === 1 ? "tenía" : "tenían"} errores.`
    );
  }
  for (const f of fallidos) partes.push(`Fila ${f.fila} (${f.nombre}): ${f.error}.`);
  return partes.join(" ");
}

const esFechaHora = (valor) => /^\d{4}-\d{2}-\d{2}T/.test(valor || "");

const COLUMNAS = [
  { titulo: "", celda: (f) => f.foto && <img className="miniatura" src={f.foto} alt="" /> },
  {
    titulo: "Grupo",
    celda: (f) => (
      <>
        <strong>{f.nombre || "—"}</strong>
        <div className="textoSuave">{f.ubicacion || "—"}</div>
      </>
    ),
  },
  {
    titulo: "Concierto",
    celda: (f) => (
      <>
        {f.concierto?.nombre || "—"}
        {esFechaHora(f.concierto?.fecha) && (
          <div className="textoSuave">
            {fechaCorta(f.concierto.fecha)}
            {f.cantidadFechas > 1 && ` y ${f.cantidadFechas - 1} más`}
          </div>
        )}
      </>
    ),
  },
  { titulo: "Tipo", celda: (f) => CATEGORIAS[f.categoria] || f.categoria || "—" },
  {
    titulo: "Cuándo",
    celda: (f) =>
      f.categoria === "comunidad" ? "Sin encuentro" : esFechaHora(f.fecha) ? fechaCorta(f.fecha) : f.fecha || "—",
  },
  { titulo: "Cupo", celda: (f) => f.cupo || "Sin límite" },
];

export default function ImportarGrupos({ onListo, onCancelar }) {
  return (
    <ImportarLista
      titulo="Importar grupos"
      ayuda="Pegá una tabla copiada de una planilla, un CSV o una tabla Markdown con: nombre, concierto (nombre o id), tipo (Previa, After, Mismo día o Comunidad), fecha y hora, punto de encuentro y, opcionales, cupo, descripción y foto (URL). Con encabezado, las columnas pueden ir en cualquier orden. Si varios conciertos se llaman igual, se usa el que cae a un día o menos del grupo; si no alcanza, poné el id. Para un grupo de varias fechas seguidas poné sus ids unidos con + (ej: 69+70+71). Un grupo de Comunidad no tiene encuentro: dejá vacías la fecha y el punto de encuentro."
      etiqueta="Lista de grupos"
      ejemplo={EJEMPLO}
      singular="grupo"
      varios="grupos"
      columnas={COLUMNAS}
      revisarLista={api.previaImportacionGrupos}
      importarLista={api.importarGrupos}
      resumen={resumen}
      onListo={onListo}
      onCancelar={onCancelar}
    />
  );
}
