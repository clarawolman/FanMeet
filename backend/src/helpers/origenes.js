import { env } from "../config/env.js";

// Vite corre en un puerto que cambia si el elegido por defecto (5173) esta
// ocupado, asi que en desarrollo aceptamos cualquier puerto de localhost en
// vez de depender de CORS_ORIGIN. En produccion se respetan unicamente
// CORS_ORIGIN y BACKOFFICE_URL (se deployan por separado), con su valor exacto.
export function esOrigenPermitido(origin) {
  if (!origin) return false;
  if (env.nodeEnv !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    return true;
  }
  return origin === env.corsOrigin || origin === env.backofficeUrl;
}
