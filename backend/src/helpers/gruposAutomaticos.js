import { conciertoYaPaso } from "./fechas.js";
import { claveGrupo } from "./importarGrupos.js";

// Grupos automáticos del backoffice: el moderador arma unas plantillas
// ("Previa de {artista}", 3 horas antes, en "Puerta del {estadio}"...) y se
// aplican a todos los conciertos próximos de una vez. La fecha y la hora de
// cada grupo salen de la del concierto más los minutos de la plantilla.

// Lo que se puede usar en el nombre, la ubicación y la descripción.
export const VARIABLES_PLANTILLA = ["artista", "estadio", "direccion", "concierto"];

function reemplazarVariables(texto, concierto) {
  const valores = {
    artista: concierto.artista?.nombre || "",
    estadio: concierto.estadio?.nombre || "",
    direccion: concierto.estadio?.direccion || concierto.estadio?.nombre || "",
    concierto: concierto.nombre || "",
  };
  return String(texto || "")
    .replace(/\{(\w+)\}/g, (original, variable) => (variable in valores ? valores[variable] : original))
    .replace(/\s+/g, " ")
    .trim();
}

// "2026-08-28T21:00:00" + (-180) -> { fecha: "2026-08-28", hora: "18:00" }.
// Las fechas se guardan en hora de Argentina sin zona: se suman los minutos
// como si fuera UTC para que no se corra la hora.
export function fechaConDesplazamiento(fechaConcierto, minutos) {
  const [dia, horaCompleta = "00:00"] = String(fechaConcierto || "").split("T");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return null;
  const base = Date.parse(`${dia}T${horaCompleta.slice(0, 5)}:00Z`);
  if (Number.isNaN(base)) return null;
  const resultado = new Date(base + minutos * 60_000).toISOString();
  return { fecha: resultado.slice(0, 10), hora: resultado.slice(11, 16) };
}

// Una fila por concierto y plantilla: { concierto, nombre, categoria, fecha,
// hora, ubicacion, descripcion, cupo, existe, error }. `existe` = ya hay un
// grupo con ese nombre en ese concierto (no se vuelve a crear).
export function armarGruposAutomaticos({ conciertos, plantillas, gruposExistentes, idsConciertos, ahora = new Date() }) {
  const yaCargados = new Set(gruposExistentes.map((g) => claveGrupo(g.nombre, g.id_concierto)));
  const elegidos = conciertos.filter(
    (c) => !conciertoYaPaso(c.fecha, ahora) && (!idsConciertos?.length || idsConciertos.includes(c.id_concierto))
  );

  const filas = [];
  for (const concierto of elegidos) {
    for (const plantilla of plantillas) {
      const nombre = reemplazarVariables(plantilla.nombre, concierto).slice(0, 100);
      const ubicacion = reemplazarVariables(plantilla.ubicacion, concierto).slice(0, 150);
      const cuando = fechaConDesplazamiento(concierto.fecha, plantilla.minutos);
      const clave = claveGrupo(nombre, concierto.id_concierto);

      let error = null;
      if (!nombre) error = "El nombre quedó vacío";
      else if (!cuando) error = "El concierto no tiene fecha";
      else if (ubicacion.length < 6) error = "El punto de encuentro quedó muy corto (el estadio no tiene nombre o dirección)";

      filas.push({
        concierto: {
          id_concierto: concierto.id_concierto,
          nombre: concierto.nombre,
          fecha: concierto.fecha,
          artista: concierto.artista?.nombre || "",
        },
        nombre,
        categoria: plantilla.categoria,
        fecha: cuando?.fecha || null,
        hora: cuando?.hora || null,
        ubicacion,
        descripcion: reemplazarVariables(plantilla.descripcion, concierto).slice(0, 500),
        cupo: plantilla.cupo || null,
        existe: yaCargados.has(clave),
        error,
      });
      // Dos plantillas que dan el mismo nombre en un concierto: solo la primera.
      yaCargados.add(clave);
    }
  }
  return filas;
}
