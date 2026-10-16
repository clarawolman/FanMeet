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

// Cada mensaje al chatbot es una llamada paga a la API de IA: limite propio
// por usuario (no por IP, para no castigar a todos los de una misma red).
export const chatbotRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id,
  message: { error: "Mandaste muchos mensajes seguidos a Fani. Esperá un minuto." },
});

// Cada reporte manda un mail al moderador: limite propio por usuario para
// que nadie llene la casilla.
export const reporteRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id,
  message: { error: "Mandaste muchos reportes seguidos. Probá de nuevo más tarde." },
});

// Limite general para el resto de la API.
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
});
