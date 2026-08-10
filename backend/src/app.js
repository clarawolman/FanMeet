import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { apiRateLimiter } from "./middlewares/rateLimiter.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

export function crearApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
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
