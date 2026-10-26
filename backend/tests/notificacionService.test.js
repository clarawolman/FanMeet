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

vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: { obtenerPorId: vi.fn(async () => null) },
}));

const { notificacionRepository } = await import("../src/repositories/notificacionRepository.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
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

describe("notificacionService: tipos silenciados en Configuración", () => {
  it("no lista ni cuenta los tipos que la persona apagó", async () => {
    usuarioRepository.obtenerPorId.mockResolvedValue({
      id_usuario: YO,
      preferencias: { notificaciones: { momentos: false } },
    });
    notificacionRepository.listarPorUsuario.mockResolvedValue([]);
    notificacionRepository.contarNoLeidas.mockResolvedValue(0);

    await notificacionService.listar(YO);
    await notificacionService.contarNoLeidas(YO);

    const silenciados = ["momento_like", "momento_comentario"];
    expect(notificacionRepository.listarPorUsuario).toHaveBeenCalledWith(YO, silenciados);
    expect(notificacionRepository.contarNoLeidas).toHaveBeenCalledWith(YO, silenciados);
  });
});
