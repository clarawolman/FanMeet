// El catálogo real (tabla estilo_musical) no tiene nombres de columna
// 100% confirmados en todo el proyecto, así que estos helpers son
// defensivos: prueban los alias más probables en orden.
export function idDeGenero(genero) {
  return genero.id_estilo ?? genero.id ?? genero.id_estilo_musical;
}

export function nombreDeGenero(genero) {
  return genero.nombre ?? genero.nombre_estilo ?? genero.genero ?? "Género";
}
