import rateLimit from "express-rate-limit";

// Limite mas estricto para login/registro: son los endpoints que hoy
// dependen de contraseñas y son el objetivo tipico de fuerza bruta.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta de nuevo mas tarde." },
});

// Limite general para el resto de la API.
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
});
