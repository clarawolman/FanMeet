import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { apiRateLimiter } from "./middlewares/rateLimiter.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

// Vite corre en un puerto que cambia si el elegido por defecto (5173) esta
// ocupado, asi que en desarrollo aceptamos cualquier puerto de localhost en
// vez de depender de CORS_ORIGIN. En produccion se respeta unicamente ese
// valor exacto.
function resolverOrigenCors(origin, callback) {
  if (!origin) return callback(null, true);

  if (env.nodeEnv !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    return callback(null, true);
  }

  if (origin === env.corsOrigin) return callback(null, true);

  return callback(new Error("Origen no permitido por CORS"));
}

export function crearApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: resolverOrigenCors }));
  app.use(express.json({ limit: "2mb" }));
  if (env.nodeEnv !== "test") {
    app.use(morgan("dev"));
  }
  app.use(apiRateLimiter);

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
