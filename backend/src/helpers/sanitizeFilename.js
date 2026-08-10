// Hoy el nombre de archivo original se concatena sin sanitizar en Storage
// (perfil.jsx: `${id_usuario}/${Date.now()}-${archivo.name}`). Mantenemos
// la misma convencion de ruta pero sacamos caracteres problematicos.
export function sanitizeFilename(nombre) {
  return String(nombre)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-100);
}

export function rutaArchivoUsuario(idUsuario, nombreOriginal) {
  return `${idUsuario}/${Date.now()}-${sanitizeFilename(nombreOriginal)}`;
}
