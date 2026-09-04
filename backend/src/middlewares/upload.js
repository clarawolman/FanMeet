import multer from "multer";
import { ApiError } from "../helpers/ApiError.js";

const MIMETYPES_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);

// Primer filtro, barato: rechaza por mimetype declarado antes de gastar
// tiempo/memoria bufferizando el archivo. No es suficiente por sí solo
// (el mimetype lo declara el cliente y se puede falsear), por eso además
// usuarioService valida los primeros bytes reales del archivo ya subido
// (ver helpers/validarImagen.js) antes de guardarlo en Storage.
// Se manda un ApiError (no un Error genérico) para que errorHandler lo
// devuelva como 400 y no como 500.
function filtrarSoloImagenes(_req, file, cb) {
  if (!MIMETYPES_PERMITIDOS.has(file.mimetype)) {
    cb(ApiError.badRequest("Solo se permiten imágenes (jpg, png o webp)"));
    return;
  }
  cb(null, true);
}

// Guarda el archivo en memoria (buffer) para subirlo directo a Supabase
// Storage desde el service, sin tocar el disco del backend.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: filtrarSoloImagenes,
});
