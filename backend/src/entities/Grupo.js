// Misma forma que arma hoy App.jsx (grupos del concierto) y MisGrupos.jsx
// (grupo + concierto + usuarios), para no romper infoGrupo.jsx/CardGrupo.jsx.
export function toGrupo(row, { usuarios = [] } = {}) {
  if (!row) return null;
  return {
    ...row,
    foto: row.foto || row.imagen || row.imagenGrupo || "",
    categoria: row.categoria,
    usuarios,
  };
}

export function toGrupoConConcierto(row, { concierto, usuarios = [] } = {}) {
  return {
    ...toGrupo(row, { usuarios }),
    concierto,
  };
}
