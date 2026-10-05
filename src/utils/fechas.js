// "2026-08-11" (como viene de la base) -> "11-08-2026"
export function formatearFechaDMA(fecha) {
  if (!fecha) return "";
  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-");
  if (!anio || !mes || !dia) return fecha;
  return `${dia}-${mes}-${anio}`;
}
