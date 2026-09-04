// Valida los primeros bytes reales del archivo (magic numbers), no el
// Content-Type que declara el cliente (eso ya lo filtra multer/upload.js
// pero se puede falsear fácilmente). Evita que alguien suba un .svg/.html
// con script embebido renombrado como si fuera un .jpg.
const FIRMAS = {
  "image/jpeg": (buffer) =>
    buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,

  "image/png": (buffer) =>
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a,

  "image/webp": (buffer) =>
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP",
};

export function esImagenValida(archivo) {
  const verificarFirma = FIRMAS[archivo?.mimetype];
  return typeof verificarFirma === "function" && verificarFirma(archivo.buffer);
}
