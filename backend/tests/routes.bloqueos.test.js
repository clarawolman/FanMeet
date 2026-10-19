import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/repositories/bloqueoRepository.js", () => ({
  bloqueoRepository: {
    idsConBloqueo: vi.fn(async () => new Set()),
    existeEntre: vi.fn(async () => false),
  },
}));
vi.mock("../src/services/bloqueoService.js", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    bloqueoService: { bloquear: vi.fn(), desbloquear: vi.fn(), listarBloqueados: vi.fn() },
  };
});
vi.mock("../src/services/usuarioService.js", () => ({
  usuarioService: { obtenerPerfilPublico: vi.fn(), listarHighlights: vi.fn() },
}));
vi.mock("../src/services/chatService.js", () => ({
  chatService: { listarMensajes: vi.fn(), enviar: vi.fn() },
}));
vi.mock("../src/config/jwks.js", () => ({ verificarToken: vi.fn() }));
vi.mock("../src/repositories/usuarioRepository.js", async (importOriginal) => {
  const original = await importOriginal();
  return {
    usuarioRepository: {
      ...original.usuarioRepository,
      obtenerEstadoYRol: vi.fn(async () => ({ estado: "activo", rol: "usuario" })),
    },
  };
});

const { bloqueoRepository } = await import("../src/repositories/bloqueoRepository.js");
const { bloqueoService } = await import("../src/services/bloqueoService.js");
const { usuarioService } = await import("../src/services/usuarioService.js");
const { chatService } = await import("../src/services/chatService.js");
const { verificarToken } = await import("../src/config/jwks.js");
const { crearApp } = await import("../src/app.js");

const app = crearApp();
const YO = "11111111-1111-1111-1111-111111111111";
const OTRO = "22222222-2222-2222-2222-222222222222";
const auth = { Authorization: "Bearer token" };

beforeEach(() => {
  vi.clearAllMocks();
  verificarToken.mockResolvedValue({ sub: YO, email: "yo@fanmeet.com" });
});

describe("rutas con :idUsuario y un bloqueo de por medio", () => {
  it("el perfil responde 404 y no llega al service", async () => {
    bloqueoRepository.existeEntre.mockResolvedValueOnce(true);

    const respuesta = await request(app).get(`/api/usuarios/${OTRO}`).set(auth);

    expect(respuesta.status).toBe(404);
    expect(bloqueoRepository.existeEntre).toHaveBeenCalledWith(YO, OTRO);
    expect(usuarioService.obtenerPerfilPublico).not.toHaveBeenCalled();
  });

  it("no se pueden mandar mensajes privados", async () => {
    bloqueoRepository.existeEntre.mockResolvedValueOnce(true);

    const respuesta = await request(app)
      .post(`/api/chats/${OTRO}/mensajes`)
      .set(auth)
      .send({ contenido: "hola" });

    expect(respuesta.status).toBe(404);
    expect(chatService.enviar).not.toHaveBeenCalled();
  });

  it("sin bloqueo, el perfil se ve normal", async () => {
    usuarioService.obtenerPerfilPublico.mockResolvedValue({ id_usuario: OTRO, nombre: "Otro" });

    const respuesta = await request(app).get(`/api/usuarios/${OTRO}/highlights`).set(auth);

    expect(respuesta.status).toBe(200);
    expect(usuarioService.listarHighlights).toHaveBeenCalledWith(OTRO);
  });

  it("el propio perfil nunca se bloquea", async () => {
    bloqueoRepository.existeEntre.mockResolvedValueOnce(true);
    usuarioService.listarHighlights.mockResolvedValue([]);

    const respuesta = await request(app).get(`/api/usuarios/${YO}/highlights`).set(auth);

    expect(respuesta.status).toBe(200);
  });
});

describe("/api/bloqueos", () => {
  it("POST valida el id (422)", async () => {
    const respuesta = await request(app).post("/api/bloqueos").set(auth).send({ id_usuario: "x" });
    expect(respuesta.status).toBe(422);
    expect(bloqueoService.bloquear).not.toHaveBeenCalled();
  });

  it("POST bloquea con el usuario del token", async () => {
    bloqueoService.bloquear.mockResolvedValue({ ok: true });
    const respuesta = await request(app).post("/api/bloqueos").set(auth).send({ id_usuario: OTRO });
    expect(respuesta.status).toBe(201);
    expect(bloqueoService.bloquear).toHaveBeenCalledWith(YO, OTRO);
  });

  it("DELETE desbloquea", async () => {
    bloqueoService.desbloquear.mockResolvedValue({ ok: true });
    const respuesta = await request(app).delete(`/api/bloqueos/${OTRO}`).set(auth);
    expect(respuesta.status).toBe(200);
    expect(bloqueoService.desbloquear).toHaveBeenCalledWith(YO, OTRO);
  });
});
