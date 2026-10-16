import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/config/jwks.js", () => ({ verificarToken: vi.fn() }));

vi.mock("../src/repositories/usuarioRepository.js", async (importOriginal) => {
  const original = await importOriginal();
  return {
    usuarioRepository: { ...original.usuarioRepository, obtenerEstadoYRol: vi.fn() },
  };
});

vi.mock("../src/services/backofficeService.js", () => ({
  backofficeService: { resumen: vi.fn(), cambiarEstadoUsuario: vi.fn() },
}));

const { verificarToken } = await import("../src/config/jwks.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { backofficeService } = await import("../src/services/backofficeService.js");
const { crearApp } = await import("../src/app.js");

const app = crearApp();
const USUARIO_ID = "11111111-1111-1111-1111-111111111111";

function conToken(req) {
  return req.set("Authorization", "Bearer token-de-prueba");
}

beforeEach(() => {
  vi.clearAllMocks();
  verificarToken.mockResolvedValue({ sub: USUARIO_ID, email: "ana@mail.com" });
  backofficeService.resumen.mockResolvedValue({ usuarios: 3 });
});

describe("rutas del backoffice", () => {
  it("403 si el usuario no es moderador", async () => {
    usuarioRepository.obtenerEstadoYRol.mockResolvedValue({ estado: "activo", rol: "usuario" });

    const respuesta = await conToken(request(app).get("/api/backoffice/resumen"));

    expect(respuesta.status).toBe(403);
    expect(backofficeService.resumen).not.toHaveBeenCalled();
  });

  it("200 si es moderador", async () => {
    usuarioRepository.obtenerEstadoYRol.mockResolvedValue({ estado: "activo", rol: "moderador" });

    const respuesta = await conToken(request(app).get("/api/backoffice/resumen"));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuarios).toBe(3);
  });

  it("422 si se suspende sin motivo", async () => {
    usuarioRepository.obtenerEstadoYRol.mockResolvedValue({ estado: "activo", rol: "moderador" });

    const respuesta = await conToken(
      request(app).patch(`/api/backoffice/usuarios/${USUARIO_ID}/estado`).send({ estado: "suspendido" })
    );

    expect(respuesta.status).toBe(422);
    expect(backofficeService.cambiarEstadoUsuario).not.toHaveBeenCalled();
  });
});

describe("usuario suspendido", () => {
  it("queda afuera de toda la API aunque su token siga siendo válido", async () => {
    usuarioRepository.obtenerEstadoYRol.mockResolvedValue({ estado: "suspendido", rol: "usuario" });

    const respuesta = await conToken(request(app).get("/api/notificaciones"));

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.details.codigo).toBe("CUENTA_SUSPENDIDA");
  });
});
