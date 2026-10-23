// Grupos generales: los de un artista que toca varios días seguidos en el
// mismo estadio pueden ser de todas esas fechas (ver supabase/grupos_generales.sql).

// Hasta cuántos días puede haber entre una fecha y la siguiente para que
// cuenten como "seguidas". Misma regla que la home (src/utils/carpetasConciertos.js).
const DIAS_MAXIMOS_ENTRE_FECHAS = 2;

// Tipo de grupo sin encuentro: no tiene fecha, hora ni punto de encuentro.
export const CATEGORIA_COMUNIDAD = "comunidad";

// Los conciertos que abarca un grupo (uno solo si no es general).
export function conciertosDelGrupo(grupo) {
  return grupo.ids_conciertos?.length ? grupo.ids_conciertos : [grupo.id_concierto];
}

export function esGrupoGeneral(grupo) {
  return conciertosDelGrupo(grupo).length > 1;
}

const dia = (concierto) => String(concierto.fecha || "").slice(0, 10);

function diasEntre(a, b) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
}

// Las fechas seguidas de un concierto (él incluido), ordenadas: mismo
// artista, mismo estadio y como mucho DIAS_MAXIMOS_ENTRE_FECHAS entre una y
// la siguiente. Si toca una sola vez, devuelve solo ese concierto.
export function fechasSeguidas(concierto, conciertos) {
  if (!dia(concierto)) return [concierto];
  const mismos = conciertos
    .filter((c) => c.id_artista === concierto.id_artista && c.id_estadio === concierto.id_estadio && dia(c))
    .sort((a, b) => dia(a).localeCompare(dia(b)));

  const posicion = mismos.findIndex((c) => c.id_concierto === concierto.id_concierto);
  if (posicion === -1) return [concierto];

  let desde = posicion;
  while (desde > 0 && diasEntre(dia(mismos[desde - 1]), dia(mismos[desde])) <= DIAS_MAXIMOS_ENTRE_FECHAS) desde--;
  let hasta = posicion;
  while (hasta < mismos.length - 1 && diasEntre(dia(mismos[hasta]), dia(mismos[hasta + 1])) <= DIAS_MAXIMOS_ENTRE_FECHAS) hasta++;
  return mismos.slice(desde, hasta + 1);
}
