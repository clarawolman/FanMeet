import { normalizarGenero } from "./generos.js";

// Importación de conciertos en lote desde el backoffice. Acepta lo que se
// pega a mano: una tabla copiada de una planilla (columnas con tab), un CSV
// (con "," o ";") o una tabla Markdown como la de supabase/conciertos_timeout.md.
// Las columnas van en el orden del formulario o con encabezado.

export const COLUMNAS = ["nombre", "artista", "estadio", "genero", "fecha", "imagen"];

// Encabezados que se reconocen (ya normalizados) y a qué campo van.
const ENCABEZADOS = {
  nombre: "nombre",
  show: "nombre",
  concierto: "nombre",
  artista: "artista",
  estadio: "estadio",
  lugar: "estadio",
  genero: "genero",
  "estilo musical": "genero",
  estilo: "genero",
  "fecha y hora": "fecha",
  fecha: "fecha",
  hora: "hora",
  imagen: "imagen",
  foto: "imagen",
  "url imagen": "imagen",
  "imagen url": "imagen",
};

// Separa una línea respetando comillas: "Ciudad, Provincia" es una celda.
function separarConComillas(linea, separador) {
  const celdas = [];
  let actual = "";
  let entreComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (c === separador && !entreComillas) {
      celdas.push(actual);
      actual = "";
    } else {
      actual += c;
    }
  }
  celdas.push(actual);
  return celdas;
}

function separarLineas(texto) {
  const lineas = String(texto || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Markdown: solo cuentan las filas de la tabla, no el resto del archivo.
  if (lineas.some((l) => l.startsWith("|"))) {
    return lineas
      .filter((l) => l.startsWith("|") && !/^\|[\s:|-]+\|?$/.test(l))
      .map((l) => l.replace(/^\||\|$/g, "").split("|"));
  }
  if (lineas.some((l) => l.includes("\t"))) {
    return lineas.map((l) => l.split("\t"));
  }
  const primera = lineas[0] || "";
  const separador = (primera.match(/;/g) || []).length > (primera.match(/,/g) || []).length ? ";" : ",";
  return lineas.map((l) => separarConComillas(l, separador));
}

// Si la primera fila es un encabezado, devuelve en qué columna está cada
// campo ({ nombre: 1, artista: 2, ... }). Si no, null.
function leerEncabezado(celdas, encabezados) {
  const posiciones = {};
  celdas.forEach((celda, i) => {
    const campo = encabezados[normalizarGenero(celda)];
    if (campo && posiciones[campo] === undefined) posiciones[campo] = i;
  });
  return Object.keys(posiciones).length >= 3 ? posiciones : null;
}

// Convierte el texto pegado en filas { fila, ...campos }. Sin encabezado,
// las columnas van en el orden de `columnas`; `campos` son todos los que se
// devuelven (incluye los que solo llegan por encabezado, como "hora").
// `fila` es el número que ve el moderador (1 = primera fila de datos).
// La usa también la importación de grupos (importarGrupos.js).
export function leerTabla(texto, { columnas, encabezados, campos = columnas }) {
  const lineas = separarLineas(texto).map((celdas) => celdas.map((c) => c.trim()));
  if (lineas.length === 0) return [];

  const encabezado = leerEncabezado(lineas[0], encabezados);
  const posiciones = encabezado || Object.fromEntries(columnas.map((campo, i) => [campo, i]));
  const datos = encabezado ? lineas.slice(1) : lineas;

  return datos.map((celdas, i) => ({
    fila: i + 1,
    ...Object.fromEntries(
      campos.map((campo) => [campo, posiciones[campo] === undefined ? "" : celdas[posiciones[campo]] || ""])
    ),
  }));
}

// Filas { fila, nombre, artista, estadio, genero, fecha, hora, imagen }.
export function leerFilas(texto) {
  return leerTabla(texto, {
    columnas: COLUMNAS,
    encabezados: ENCABEZADOS,
    campos: ["nombre", "artista", "estadio", "genero", "fecha", "hora", "imagen"],
  });
}

const dosDigitos = (n) => String(n).padStart(2, "0");

// "15/01/2027 21:00", "2027-01-15 21:00" o "2027-01-15T21:00" (la hora
// puede venir en otra columna) -> "2027-01-15T21:00". null si no es una
// fecha real; { sinHora: true } si falta la hora.
export function leerFechaHora(fecha, hora = "") {
  const texto = `${fecha} ${hora}`.trim().replace("T", " ");
  let dia, mes, anio, resto;

  let m = texto.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\s*(.*)$/);
  if (m) {
    [, dia, mes, anio, resto] = m;
  } else {
    m = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s*(.*)$/);
    if (!m) return null;
    [, anio, mes, dia, resto] = m;
  }

  const real = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
  if (real.getUTCDate() !== Number(dia) || real.getUTCMonth() !== Number(mes) - 1) return null;

  if (!resto) return { sinHora: true };
  const h = resto.replace(/\s*(hs|h)\.?$/i, "").match(/^(\d{1,2}):(\d{2})(:\d{2})?$/);
  if (!h || Number(h[1]) > 23 || Number(h[2]) > 59) return null;

  return `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}T${dosDigitos(h[1])}:${h[2]}`;
}

export function esUrlHttp(texto) {
  try {
    const url = new URL(texto);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// Mismo concierto = mismo nombre (sin importar mayúsculas ni tildes) el mismo día.
export function claveConcierto(nombre, fecha) {
  return `${normalizarGenero(nombre)}|${String(fecha).slice(0, 10)}`;
}
