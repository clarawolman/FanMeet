import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/services/authService.js", () => ({
  authService: { login: vi.fn(), registro: vi.fn(), logout: vi.fn() },
}));

const { authService } = await import("../src/services/authService.js");
const { crearApp } = await import("../src/app.js");

const app = crearApp();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("200 cuando el service resuelve bien", async () => {
    authService.login.mockResolvedValue({ usuario: { id_usuario: "u1" }, session: {} });

    const respuesta = await request(app)
      .post("/api/auth/login")
      .send({ usuarioOMail: "ana@mail.com", contrasena: "Abcdef1!" });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario.id_usuario).toBe("u1");
  });

  it("422 si faltan campos obligatorios (validación server-side)", async () => {
    const respuesta = await request(app).post("/api/auth/login").send({ usuarioOMail: "" });

    expect(respuesta.status).toBe(422);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("401 cuando el service rechaza las credenciales", async () => {
    const { ApiError } = await import("../src/helpers/ApiError.js");
    authService.login.mockRejectedValue(ApiError.unauthorized("Usuario/mail o contraseña incorrectos"));

    const respuesta = await request(app)
      .post("/api/auth/login")
      .send({ usuarioOMail: "ana@mail.com", contrasena: "mala" });

    expect(respuesta.status).toBe(401);
  });
});

describe("POST /api/auth/registro", () => {
  it("422 si la contraseña no cumple las reglas de complejidad", async () => {
    const respuesta = await request(app)
      .post("/api/auth/registro")
      .send({
        nombre: "Ana",
        mail: "ana@mail.com",
        contrasena: "1234",
        fechanac: "2000-01-01",
        genero: "F",
        estilo_asistencia: "pogo",
        estilos_musicales: [1, 2],
      });

    expect(respuesta.status).toBe(422);
    expect(authService.registro).not.toHaveBeenCalled();
  });

  it("201 cuando el registro es válido", async () => {
    authService.registro.mockResolvedValue({ usuario: { id_usuario: "u1" }, session: {} });

    const respuesta = await request(app)
      .post("/api/auth/registro")
      .send({
        nombre: "Ana",
        mail: "ana@mail.com",
        contrasena: "Abcdef1!",
        fechanac: "2000-01-01",
        genero: "F",
        estilo_asistencia: "pogo",
        estilos_musicales: [1, 2],
      });

    expect(respuesta.status).toBe(201);
  });
});

describe("rutas inexistentes", () => {
  it("404 con el manejador centralizado", async () => {
    const respuesta = await request(app).get("/api/no-existe");
    expect(respuesta.status).toBe(404);
  });
});

describe("GET /health", () => {
  it("200 sin autenticación", async () => {
    const respuesta = await request(app).get("/health");
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ ok: true });
  });
});
