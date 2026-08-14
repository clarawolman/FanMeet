import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/services/notificacionService.js", () => ({
  notificacionService: {
    listar: vi.fn(),
    contarNoLeidas: vi.fn(),
    marcarLeidas: vi.fn(),
    eliminar: vi.fn(),
  },
}));

vi.mock("../src/config/jwks.js", () => ({ verificarToken: vi.fn() }));

const { notificacionService } = await import("../src/services/notificacionService.js");
const { verificarToken } = await import("../src/config/jwks.js");
const { ApiError } = await import("../src/helpers/ApiError.js");
const { crearApp } = await import("../src/app.js");

const app = crearApp();
const token = "token-de-prueba";

beforeEach(() => {
  vi.clearAllMocks();
  verificarToken.mockResolvedValue({ sub: "11111111-1111-1111-1111-111111111111", email: "test@fanmeet.com" });
});

describe("GET /api/notificaciones", () => {
  it("401 sin token", async () => {
    const respuesta = await request(app).get("/api/notificaciones");
    expect(respuesta.status).toBe(401);
  });

  it("200 con token válido, devuelve solo lo que el service resuelve para ese usuario", async () => {
    notificacionService.listar.mockResolvedValue([{ id_notificacion: 1 }]);

    const respuesta = await request(app)
      .get("/api/notificaciones")
      .set("Authorization", `Bearer ${token}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(1);
  });
});

describe("DELETE /api/notificaciones/:idNotificacion", () => {
  it("404 si la notificación no existe o no es del usuario autenticado", async () => {
    notificacionService.eliminar.mockRejectedValue(ApiError.notFound("La notificación no existe"));

    const respuesta = await request(app)
      .delete("/api/notificaciones/1")
      .set("Authorization", `Bearer ${token}`);

    expect(respuesta.status).toBe(404);
  });

  it("200 si se pudo eliminar", async () => {
    notificacionService.eliminar.mockResolvedValue({ ok: true });

    const respuesta = await request(app)
      .delete("/api/notificaciones/1")
      .set("Authorization", `Bearer ${token}`);

    expect(respuesta.status).toBe(200);
  });
});

describe("PATCH /api/notificaciones/leidas", () => {
  it("422 si 'ids' viene vacío", async () => {
    const respuesta = await request(app)
      .patch("/api/notificaciones/leidas")
      .set("Authorization", `Bearer ${token}`)
      .send({ ids: [] });

    expect(respuesta.status).toBe(422);
    expect(notificacionService.marcarLeidas).not.toHaveBeenCalled();
  });
});
