import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/services/amistadService.js", () => ({
  amistadService: {
    obtenerEstado: vi.fn(),
    crearSolicitud: vi.fn(),
    aceptar: vi.fn(),
    rechazarOEliminar: vi.fn(),
    listarAmigos: vi.fn(),
  },
}));

vi.mock("../src/config/jwks.js", () => ({ verificarToken: vi.fn() }));

const { amistadService } = await import("../src/services/amistadService.js");
const { verificarToken } = await import("../src/config/jwks.js");
const { ApiError } = await import("../src/helpers/ApiError.js");
const { crearApp } = await import("../src/app.js");

const app = crearApp();
const token = "token-de-prueba";
const USUARIO_ID = "11111111-1111-1111-1111-111111111111";
const ID_RECEPTOR = "22222222-2222-2222-2222-222222222222";

beforeEach(() => {
  vi.clearAllMocks();
  verificarToken.mockResolvedValue({ sub: USUARIO_ID, email: "test@fanmeet.com" });
});

describe("PATCH /api/amistades/:idAmistad/aceptar", () => {
  it("401 sin token", async () => {
    const respuesta = await request(app).patch("/api/amistades/1/aceptar");
    expect(respuesta.status).toBe(401);
  });

  it("403 si el usuario autenticado no es el receptor de la solicitud", async () => {
    amistadService.aceptar.mockRejectedValue(
      ApiError.forbidden("Solo quien recibió la solicitud puede aceptarla")
    );

    const respuesta = await request(app)
      .patch("/api/amistades/1/aceptar")
      .set("Authorization", `Bearer ${token}`);

    expect(respuesta.status).toBe(403);
  });

  it("200 si el usuario autenticado es el receptor", async () => {
    amistadService.aceptar.mockResolvedValue({ id_amistad: 1, estado: "aceptada" });

    const respuesta = await request(app)
      .patch("/api/amistades/1/aceptar")
      .set("Authorization", `Bearer ${token}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe("aceptada");
  });
});

describe("POST /api/amistades", () => {
  it("422 si id_receptor no es un uuid válido", async () => {
    const respuesta = await request(app)
      .post("/api/amistades")
      .set("Authorization", `Bearer ${token}`)
      .send({ id_receptor: "no-es-uuid" });

    expect(respuesta.status).toBe(422);
    expect(amistadService.crearSolicitud).not.toHaveBeenCalled();
  });

  it("400 si el service detecta una relación duplicada", async () => {
    amistadService.crearSolicitud.mockRejectedValue(
      ApiError.badRequest("Ya existe una relación con este usuario")
    );

    const respuesta = await request(app)
      .post("/api/amistades")
      .set("Authorization", `Bearer ${token}`)
      .send({ id_receptor: ID_RECEPTOR });

    expect(respuesta.status).toBe(400);
  });
});
