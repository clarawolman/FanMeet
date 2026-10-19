import { describe, it, expect, vi, beforeEach } from "vitest";
import { errorHandler } from "../src/middlewares/errorHandler.js";
import { ApiError } from "../src/helpers/ApiError.js";

function respuestaFalsa() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("errorHandler", () => {
  it("los 503 pasan con su texto (están pensados para el usuario)", () => {
    const res = respuestaFalsa();
    errorHandler(new ApiError(503, "Last.fm está limitando las consultas"), {}, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: "Last.fm está limitando las consultas" });
  });

  it("los 500 nunca muestran el detalle interno", () => {
    const res = respuestaFalsa();
    errorHandler(ApiError.internal("permission denied for table estilo_musical"), {}, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error interno del servidor" });
  });

  it("errores no previstos también quedan ocultos", () => {
    const res = respuestaFalsa();
    errorHandler(new Error("detalle de postgres"), {}, res);
    expect(res.json).toHaveBeenCalledWith({ error: "Error interno del servidor" });
  });
});

describe("errorHandler con errores de multer", () => {
  it("una foto de más de 5 MB responde 400, no 500", async () => {
    const { default: multer } = await import("multer");
    const { errorHandler } = await import("../src/middlewares/errorHandler.js");
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    errorHandler(new multer.MulterError("LIMIT_FILE_SIZE"), {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "La foto no puede superar los 5 MB" });
  });
});
