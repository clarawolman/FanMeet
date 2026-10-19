import multer from "multer";
import { ApiError } from "../helpers/ApiError.js";

const MENSAJES_MULTER = {
  LIMIT_FILE_SIZE: "Cada foto puede pesar hasta 5 MB",
  LIMIT_FILE_COUNT: "Subiste demasiadas fotos",
  LIMIT_UNEXPECTED_FILE: "Subiste demasiadas fotos",
};

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`No existe la ruta ${req.method} ${req.originalUrl}`));
}

// Middleware centralizado: todos los controllers/services lanzan errores
// (ApiError o errores de Supabase) y terminan aca, nunca se arman
// responses de error a mano en cada controller.
// Los errores 5xx (fallos de Supabase/Postgres, bugs no previstos, etc.)
// nunca deben llegar al cliente con su mensaje real: podrían revelar
// nombres de tabla/columna/constraint u otra info interna. El detalle
// completo solo queda en el log del servidor.
export function errorHandler(err, _req, res, _next) {
  // Archivo de más de 5 MB (o campos de más): es culpa del pedido, no del
  // servidor.
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: MENSAJES_MULTER[err.code] || "No se pudo subir el archivo" });
  }

  if (err instanceof ApiError) {
    // Los 503 los lanzamos a proposito con un texto pensado para el usuario
    // ("Last.fm está limitando las consultas..."): esos si pasan.
    if (err.status === 503) {
      console.error(err);
      return res.status(503).json({ error: err.message });
    }
    if (err.status >= 500) {
      console.error(err);
      return res.status(err.status).json({ error: "Error interno del servidor" });
    }

    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  console.error(err);
  return res.status(500).json({ error: "Error interno del servidor" });
}
