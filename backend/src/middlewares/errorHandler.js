import { ApiError } from "../helpers/ApiError.js";

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`No existe la ruta ${req.method} ${req.originalUrl}`));
}

// Middleware centralizado: todos los controllers/services lanzan errores
// (ApiError o errores de Supabase) y terminan aca, nunca se arman
// responses de error a mano en cada controller.
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    if (err.status >= 500) console.error(err);
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  console.error(err);
  return res.status(500).json({ error: "Error interno del servidor" });
}
