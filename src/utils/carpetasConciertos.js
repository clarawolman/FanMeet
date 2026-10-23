// Cuando un artista toca varios días seguidos en el mismo estadio (ej. María
// Becerra 13, 14 y 15 de noviembre en el Movistar Arena), en la home esas
// fechas van juntas en una "carpeta" en vez de tres cards iguales.

// Hasta cuántos días puede haber entre una fecha y la siguiente para que
// cuenten como "seguidas" (2 = permite un día de descanso en el medio).
const DIAS_MAXIMOS_ENTRE_FECHAS = 2;

const dia = (concierto) => String(concierto.fecha || "").slice(0, 10);

function diasEntre(a, b) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
}

function claveArtistaEstadio(concierto) {
  const artista = concierto.id_artista ?? concierto.artista?.nombre;
  const estadio = concierto.id_estadio ?? concierto.estadio?.nombre;
  if (artista == null || estadio == null || !dia(concierto)) return null;
  return `${artista}|${estadio}`;
}

// Devuelve la lista con las fechas seguidas agrupadas: cada elemento es un
// concierto suelto o { carpeta: true, fechas: [...] } (ordenadas por fecha).
// La carpeta queda en el lugar de su primera fecha en la lista original.
export function agruparFechasSeguidas(conciertos) {
  const porClave = new Map();
  for (const concierto of conciertos) {
    const clave = claveArtistaEstadio(concierto);
    if (!clave) continue;
    if (!porClave.has(clave)) porClave.set(clave, []);
    porClave.get(clave).push(concierto);
  }

  // Cada concierto que va en una carpeta apunta a su carpeta.
  const carpetaDe = new Map();
  for (const lista of porClave.values()) {
    if (lista.length < 2) continue;
    const ordenados = [...lista].sort((a, b) => dia(a).localeCompare(dia(b)));
    let tanda = [ordenados[0]];
    const cerrarTanda = () => {
      if (tanda.length < 2) return;
      const carpeta = { carpeta: true, fechas: tanda };
      for (const c of tanda) carpetaDe.set(c, carpeta);
    };
    for (const concierto of ordenados.slice(1)) {
      if (diasEntre(dia(tanda[tanda.length - 1]), dia(concierto)) <= DIAS_MAXIMOS_ENTRE_FECHAS) {
        tanda.push(concierto);
      } else {
        cerrarTanda();
        tanda = [concierto];
      }
    }
    cerrarTanda();
  }

  const resultado = [];
  const yaPuestas = new Set();
  for (const concierto of conciertos) {
    const carpeta = carpetaDe.get(concierto);
    if (!carpeta) resultado.push(concierto);
    else if (!yaPuestas.has(carpeta)) {
      yaPuestas.add(carpeta);
      resultado.push(carpeta);
    }
  }
  return resultado;
}
