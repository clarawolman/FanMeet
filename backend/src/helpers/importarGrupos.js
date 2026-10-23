import { normalizarGenero } from "./generos.js";
import { leerTabla } from "./importarConciertos.js";

// Importación de grupos en lote desde el backoffice. Mismos formatos que la
// de conciertos (planilla, CSV o tabla Markdown). El concierto se indica por
// nombre o por id; un grupo de varias fechas seguidas lleva los ids unidos
// con "+" ("69+70+71"). Cupo, descripción y foto son opcionales, y un grupo
// de comunidad no lleva fecha ni punto de encuentro.

export const COLUMNAS_GRUPO = ["nombre", "concierto", "categoria", "fecha", "ubicacion", "cupo", "descripcion", "foto"];

const ENCABEZADOS = {
  nombre: "nombre",
  grupo: "nombre",
  "nombre del grupo": "nombre",
  concierto: "concierto",
  show: "concierto",
  "id concierto": "concierto",
  tipo: "categoria",
  categoria: "categoria",
  "fecha y hora": "fecha",
  fecha: "fecha",
  hora: "hora",
  "punto de encuentro": "ubicacion",
  ubicacion: "ubicacion",
  lugar: "ubicacion",
  cupo: "cupo",
  descripcion: "descripcion",
  foto: "foto",
  imagen: "foto",
};

// Filas { fila, nombre, concierto, categoria, fecha, hora, ubicacion, cupo, descripcion, foto }.
export function leerFilasGrupos(texto) {
  return leerTabla(texto, {
    columnas: COLUMNAS_GRUPO,
    encabezados: ENCABEZADOS,
    campos: [...COLUMNAS_GRUPO, "hora"],
  });
}

const CATEGORIAS = {
  pre: "pre",
  previa: "pre",
  after: "after",
  "mismo dia": "mismo_dia",
  mismo_dia: "mismo_dia",
  comunidad: "comunidad",
  "sin encuentro": "comunidad",
};

// "Previa", "after", "Mismo día", "Comunidad"... -> "pre" | "after" |
// "mismo_dia" | "comunidad". null si no se reconoce.
export function leerCategoria(texto) {
  return CATEGORIAS[normalizarGenero(texto)] || null;
}

// Mismo grupo = mismo nombre (sin mayúsculas ni tildes) en el mismo concierto.
export function claveGrupo(nombre, idConcierto) {
  return `${normalizarGenero(nombre)}|${idConcierto}`;
}
