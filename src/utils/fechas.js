// "2026-08-11" (como viene de la base) -> "11-08-2026"
export function formatearFechaDMA(fecha) {
  if (!fecha) return "";
  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-");
  if (!anio || !mes || !dia) return fecha;
  return `${dia}-${mes}-${anio}`;
}

// Cuánto falta para una fecha ("2026-08-11" o "2026-08-15T20:00:00"),
// contando días de calendario: "Hoy", "Mañana", "En 5 días" o "Ya pasó".
export function cuentaRegresiva(fecha) {
  if (!fecha) return "";
  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return "";
  const hoy = new Date();
  const inicioHoy = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = Math.round((Date.UTC(anio, mes - 1, dia) - inicioHoy) / 86400000);
  if (dias < 0) return "Ya pasó";
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
}

// Separa conciertos en próximos (el más cercano primero; los que no tienen
// fecha van al final) y pasados (el más reciente primero). Hoy cuenta como
// próximo, igual que en cuentaRegresiva.
export function separarProximosYPasados(eventos) {
  const hoy = new Date();
  const claveHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const clave = (evento) => String(evento.fecha || "").slice(0, 10);

  const proximos = [];
  const pasados = [];
  for (const evento of eventos || []) {
    if (clave(evento) && clave(evento) < claveHoy) pasados.push(evento);
    else proximos.push(evento);
  }

  proximos.sort((a, b) => (clave(a) || "9999").localeCompare(clave(b) || "9999"));
  pasados.sort((a, b) => clave(b).localeCompare(clave(a)));
  return { proximos, pasados };
}

// "2026-08-15T20:00:00" -> "sáb 15 de agosto"
export function formatearFechaLarga(fecha) {
  if (!fecha) return "";
  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return String(fecha);
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

// "2027-09-23" -> { dia: "23", mes: "sep", anio: "2027" } (para chips de fecha)
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function partesFecha(fecha) {
  if (!fecha) return null;
  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return null;
  return { dia: String(dia), mes: MESES_CORTOS[mes - 1], anio: String(anio) };
}

// Como en Instagram: "Recién", "5 min", "3 h", "2 d", y después la fecha
// ("12 de agosto", con año si no es este año).
export function haceCuanto(fecha, ahora = new Date()) {
  if (!fecha) return "";
  const momento = new Date(fecha);
  if (Number.isNaN(momento.getTime())) return "";
  const minutos = Math.floor((ahora - momento) / 60000);
  if (minutos < 1) return "Recién";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `${dias} d`;
  return momento.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: momento.getFullYear() === ahora.getFullYear() ? undefined : "numeric",
  });
}
