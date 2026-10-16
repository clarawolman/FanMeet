// Las fechas de los conciertos se guardan en hora de Argentina
// ("2026-08-28T21:00:00"). Un concierto sigue vigente todo el día del show
// y pasa a ser "ya pasó" al día siguiente.
const ZONA_ARGENTINA = "America/Argentina/Buenos_Aires";

// "2026-10-16" (en-CA formatea como YYYY-MM-DD).
export function hoyEnArgentina(ahora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_ARGENTINA }).format(ahora);
}

export function conciertoYaPaso(fecha, ahora = new Date()) {
  if (!fecha) return false;
  return String(fecha).slice(0, 10) < hoyEnArgentina(ahora);
}
