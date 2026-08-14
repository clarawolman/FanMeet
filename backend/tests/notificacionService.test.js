import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/notificacionRepository.js", () => ({
  notificacionRepository: {
    crear: vi.fn(),
    listarPorUsuario: vi.fn(),
    contarNoLeidas: vi.fn(),
    marcarLeidas: vi.fn(),
    eliminar: vi.fn(),
  },
}));

const { notificacionRepository } = await import("../src/repositories/notificacionRepository.js");
const { notificacionService } = await import("../src/services/notificacionService.js");

const YO = "yo-uuid";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("notificacionService.listar", () => {
  it("marca automáticamente como leídas las que llegan sin leer, filtrando por el propio usuario", async () => {
    notificacionRepository.listarPorUsuario.mockResolvedValue([
      { id_notificacion: 1, id_usuario: YO, leida: false, tipo: "grupo_unido" },
      { id_notificacion: 2, id_usuario: YO, leida: true, tipo: "concierto_unido" },
    ]);
    notificacionRepository.marcarLeidas.mockResolvedValue([]);

    await notificacionService.listar(YO);

    expect(notificacionRepository.marcarLeidas).toHaveBeenCalledWith(YO, [1]);
  });

  it("no llama a marcarLeidas si no hay notificaciones sin leer", async () => {
    notificacionRepository.listarPorUsuario.mockResolvedValue([
      { id_notificacion: 2, id_usuario: YO, leida: true },
    ]);

    await notificacionService.listar(YO);

    expect(notificacionRepository.marcarLeidas).not.toHaveBeenCalled();
  });
});

describe("notificacionService.eliminar (autorización)", () => {
  it("rechaza con 404 si no borró nada (no existe o no es del usuario autenticado)", async () => {
    notificacionRepository.eliminar.mockResolvedValue([]);

    await expect(notificacionService.eliminar(YO, 99)).rejects.toMatchObject({ status: 404 });
  });

  it("siempre filtra el DELETE por el id del usuario autenticado", async () => {
    notificacionRepository.eliminar.mockResolvedValue([{ id_notificacion: 1 }]);

    await notificacionService.eliminar(YO, 1);

    expect(notificacionRepository.eliminar).toHaveBeenCalledWith(YO, 1);
  });
});
