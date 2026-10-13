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
