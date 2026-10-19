// Comprueba que una URL de imagen cargue de verdad, como la ve la app:
// responde 2xx y es una imagen. Devuelve null si está bien o el motivo.
// Solo lee los encabezados: corta la descarga antes de bajar la imagen.
export async function problemaConImagen(url, { timeoutMs = 8000 } = {}) {
  try {
    const respuesta = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
    await respuesta.body?.cancel();
    if (!respuesta.ok) return `La imagen no carga (error ${respuesta.status})`;
    const tipo = respuesta.headers.get("content-type") || "";
    if (!tipo.startsWith("image/")) return "El enlace no es una imagen";
    return null;
  } catch {
    return "La imagen no carga";
  }
}
