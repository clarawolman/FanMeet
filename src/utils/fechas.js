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
