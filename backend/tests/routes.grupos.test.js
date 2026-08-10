import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/services/grupoService.js", () => ({
  grupoService: {
    crear: vi.fn(),
    obtenerDetalle: vi.fn(),
    listarMisGrupos: vi.fn(),
    unirse: vi.fn(),
    salir: vi.fn(),
    eliminar: vi.fn(),
  },
}));

// El proyecto real usa JWT Signing Keys asimétricas (ES256) verificadas
// contra el JWKS público de Supabase (ver src/config/jwks.js); en los
// tests no hay red, así que se mockea esa verificación en vez de firmar
// tokens HS256 falsos.
vi.mock("../src/config/jwks.js", () => ({ verificarToken: vi.fn() }));

const { grupoService } = await import("../src/services/grupoService.js");
const { verificarToken } = await import("../src/config/jwks.js");
const { ApiError } = await import("../src/helpers/ApiError.js");
const { crearApp } = await import("../src/app.js");

const app = crearApp();
const token = "token-de-prueba";
const USUARIO_ID = "11111111-1111-1111-1111-111111111111";

const GRUPO_VALIDO = {
  nombre: "Previa",
  ubicacion: "Plaza principal",
  fecha: "2026-09-01",
  hora: "20:00",
  categoria: "pre",
  id_concierto: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  verificarToken.mockResolvedValue({ sub: USUARIO_ID, email: "test@fanmeet.com" });
});

describe("POST /api/grupos", () => {
  it("401 sin token", async () => {
    const respuesta = await request(app).post("/api/grupos").send(GRUPO_VALIDO);
    expect(respuesta.status).toBe(401);
    expect(grupoService.crear).not.toHaveBeenCalled();
  });

  it("401 con token expirado/inválido", async () => {
    verificarToken.mockRejectedValueOnce(new Error("expirado"));

    const respuesta = await request(app)
      .post("/api/grupos")
      .set("Authorization", `Bearer ${token}`)
      .send(GRUPO_VALIDO);
    expect(respuesta.status).toBe(401);
  });

  it("422 si falta un campo obligatorio (ubicación muy corta)", async () => {
    const respuesta = await request(app)
      .post("/api/grupos")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...GRUPO_VALIDO, ubicacion: "abc" });

    expect(respuesta.status).toBe(422);
    expect(grupoService.crear).not.toHaveBeenCalled();
  });

  it("201 con datos válidos y token vigente", async () => {
    grupoService.crear.mockResolvedValue({ id_grupo: 1, ...GRUPO_VALIDO });

    const respuesta = await request(app)
      .post("/api/grupos")
      .set("Authorization", `Bearer ${token}`)
      .send(GRUPO_VALIDO);

    expect(respuesta.status).toBe(201);
    expect(grupoService.crear).toHaveBeenCalledWith(expect.any(String), expect.objectContaining(GRUPO_VALIDO));
  });
});

describe("DELETE /api/grupos/:idGrupo (autorización de borrado)", () => {
  it("403 si el service determina que no es el creador", async () => {
    grupoService.eliminar.mockRejectedValue(ApiError.forbidden("Solo el creador puede eliminar el grupo"));

    const respuesta = await request(app)
      .delete("/api/grupos/1")
      .set("Authorization", `Bearer ${token}`);

    expect(respuesta.status).toBe(403);
  });

  it("404 si el grupo no existe", async () => {
    grupoService.eliminar.mockRejectedValue(ApiError.notFound("El grupo no existe"));

    const respuesta = await request(app)
      .delete("/api/grupos/999")
      .set("Authorization", `Bearer ${token}`);

    expect(respuesta.status).toBe(404);
  });

  it("422 si el id de grupo no es numérico", async () => {
    const respuesta = await request(app)
      .delete("/api/grupos/no-es-un-id")
      .set("Authorization", `Bearer ${token}`);

    expect(respuesta.status).toBe(422);
    expect(grupoService.eliminar).not.toHaveBeenCalled();
  });

  it("200 si el service confirma que puede borrar", async () => {
    grupoService.eliminar.mockResolvedValue({ ok: true });

    const respuesta = await request(app)
      .delete("/api/grupos/1")
      .set("Authorization", `Bearer ${token}`);

    expect(respuesta.status).toBe(200);
  });
});

describe("errores no controlados", () => {
  it("500 cuando el service lanza un error inesperado (no ApiError)", async () => {
    grupoService.obtenerDetalle.mockRejectedValue(new Error("boom"));

    const respuesta = await request(app)
      .get("/api/grupos/1")
      .set("Authorization", `Bearer ${token}`);

    expect(respuesta.status).toBe(500);
  });
});
