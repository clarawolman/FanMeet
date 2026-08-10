import multer from "multer";

// Guarda el archivo en memoria (buffer) para subirlo directo a Supabase
// Storage desde el service, sin tocar el disco del backend.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
