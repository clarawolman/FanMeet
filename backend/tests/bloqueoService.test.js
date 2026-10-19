import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/bloqueoRepository.js", () => ({
  bloqueoRepository: {
    crear: vi.fn(),
    eliminar: vi.fn(),
    listarBloqueadosPor: vi.fn(),
    idsConBloqueo: vi.fn(),
    existeEntre: vi.fn(),
  },
}));
vi.mock("../src/repositories/amistadRepository.js", () => ({
  amistadRepository: { buscarEntreUsuarios: vi.fn(), eliminar: vi.fn() },
}));
vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: { obtenerPorId: vi.fn(), listarPorIds: vi.fn() },
}));
vi.mock("../src/repositories/notificacionRepository.js", () => ({
  notificacionRepository: { eliminarEntreUsuarios: vi.fn() },
}));

const { bloqueoRepository } = await import("../src/repositories/bloqueoRepository.js");
const { amistadRepository } = await import("../src/repositories/amistadRepository.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { notificacionRepository } = await import("../src/repositories/notificacionRepository.js");
const { bloqueoService, sinBloqueados, exigirSinBloqueo } = await import(
  "../src/services/bloqueoService.js"
);

const YO = "yo-uuid";
const OTRO = "otro-uuid";

beforeEach(() => {
  vi.clearAllMocks();
  usuarioRepository.obtenerPorId.mockResolvedValue({ id_usuario: OTRO, nombre: "Otro" });
  amistadRepository.buscarEntreUsuarios.mockResolvedValue(null);
});

describe("bloqueoService.bloquear", () => {
  it("no deja bloquearse a uno mismo", async () => {
    await expect(bloqueoService.bloquear(YO, YO)).rejects.toMatchObject({ status: 400 });
    expect(bloqueoRepository.crear).not.toHaveBeenCalled();
  });

  it("404 si el usuario no existe", async () => {
    usuarioRepository.obtenerPorId.mockResolvedValue(null);
    await expect(bloqueoService.bloquear(YO, OTRO)).rejects.toMatchObject({ status: 404 });
    expect(bloqueoRepository.crear).not.toHaveBeenCalled();
  });

  it("guarda el bloqueo, borra la amistad y las notificaciones entre los dos", async () => {
    amistadRepository.buscarEntreUsuarios.mockResolvedValue({ id_amistad: 12, estado: "aceptada" });

    await bloqueoService.bloquear(YO, OTRO);

    expect(bloqueoRepository.crear).toHaveBeenCalledWith(YO, OTRO);
    expect(amistadRepository.eliminar).toHaveBeenCalledWith(12);
    expect(notificacionRepository.eliminarEntreUsuarios).toHaveBeenCalledWith(YO, OTRO, [
      "solicitud_amistad",
      "amistad_aceptada",
      "mensaje_privado",
    ]);
  });

  it("sin amistad previa no borra nada de amistad", async () => {
    await bloqueoService.bloquear(YO, OTRO);
    expect(amistadRepository.eliminar).not.toHaveBeenCalled();
  });
});

describe("bloqueoService.desbloquear y listarBloqueados", () => {
  it("desbloquear solo borra el bloqueo que hizo quien lo pide", async () => {
    await bloqueoService.desbloquear(YO, OTRO);
    expect(bloqueoRepository.eliminar).toHaveBeenCalledWith(YO, OTRO);
  });

  it("lista los bloqueados con su nombre y foto, en el orden del bloqueo", async () => {
    bloqueoRepository.listarBloqueadosPor.mockResolvedValue([
      { id_bloqueado: "b", created_at: "2026-10-19T10:00:00Z" },
      { id_bloqueado: "a", created_at: "2026-10-18T10:00:00Z" },
    ]);
    usuarioRepository.listarPorIds.mockResolvedValue([
      { id_usuario: "a", nombre: "Ana" },
      { id_usuario: "b", nombre: "Beto" },
    ]);

    const lista = await bloqueoService.listarBloqueados(YO);

    expect(lista.map((u) => u.nombre)).toEqual(["Beto", "Ana"]);
    expect(lista[0]).toMatchObject({ id_usuario: "b", bloqueado_at: "2026-10-19T10:00:00Z" });
  });

  it("sin bloqueados no consulta usuarios", async () => {
    bloqueoRepository.listarBloqueadosPor.mockResolvedValue([]);
    expect(await bloqueoService.listarBloqueados(YO)).toEqual([]);
    expect(usuarioRepository.listarPorIds).not.toHaveBeenCalled();
  });
});

describe("helpers de bloqueo", () => {
  it("sinBloqueados saca a los que tienen un bloqueo en cualquier sentido", async () => {
    bloqueoRepository.idsConBloqueo.mockResolvedValue(new Set(["b"]));
    const filas = [{ id_usuario: "a" }, { id_usuario: "b" }];
    expect(await sinBloqueados(YO, filas)).toEqual([{ id_usuario: "a" }]);
  });

  it("exigirSinBloqueo responde 404, como si el usuario no existiera", async () => {
    bloqueoRepository.existeEntre.mockResolvedValue(true);
    await expect(exigirSinBloqueo(YO, OTRO)).rejects.toMatchObject({
      status: 404,
      message: "El usuario no existe",
    });
  });

  it("exigirSinBloqueo con uno mismo no consulta nada", async () => {
    await exigirSinBloqueo(YO, YO);
    expect(bloqueoRepository.existeEntre).not.toHaveBeenCalled();
  });
});
