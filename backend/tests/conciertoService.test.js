import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/conciertoRepository.js", () => ({
  conciertoRepository: {
    listarTodos: vi.fn(),
    obtenerPorId: vi.fn(),
    obtenerArtista: vi.fn(),
    obtenerEstadio: vi.fn(),
  },
  usuariosConciertosRepository: {
    existeRelacion: vi.fn(),
    crearRelacion: vi.fn(),
    eliminarRelacion: vi.fn(),
    listarConciertosPorUsuario: vi.fn(),
    listarUsuariosPorConcierto: vi.fn(),
  },
}));

vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoRepository: { listarPorConcierto: vi.fn() },
  grupoUsuarioRepository: { eliminarDeGruposIds: vi.fn(), listarUsuariosPorGrupo: vi.fn() },
}));

vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: { listarPorIds: vi.fn() },
}));

vi.mock("../src/services/notificacionService.js", () => ({
  notificacionService: { crear: vi.fn() },
}));

const { conciertoRepository, usuariosConciertosRepository } = await import(
  "../src/repositories/conciertoRepository.js"
);
const { grupoRepository, grupoUsuarioRepository } = await import("../src/repositories/grupoRepository.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { notificacionService } = await import("../src/services/notificacionService.js");
const { conciertoService } = await import("../src/services/conciertoService.js");

const YO = "yo-uuid";
const CONCIERTO = { id_concierto: 1, nombre: "Show", id_artista: 1, id_estadio: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  usuarioRepository.listarPorIds.mockResolvedValue([]);
});

describe("conciertoService.unirsePorCodigo", () => {
  it("rechaza con 400 si el código no coincide con CONCIERTO_ACCESS_CODE", async () => {
    await expect(
      conciertoService.unirsePorCodigo(YO, 1, "codigo-incorrecto")
    ).rejects.toMatchObject({ status: 400 });
    expect(usuariosConciertosRepository.crearRelacion).not.toHaveBeenCalled();
  });

  it("rechaza con 404 si el concierto no existe", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(null);

    await expect(
      conciertoService.unirsePorCodigo(YO, 1, "FANMEET2026")
    ).rejects.toMatchObject({ status: 404 });
  });

  it("es idempotente si el usuario ya estaba unido", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(CONCIERTO);
    usuariosConciertosRepository.existeRelacion.mockResolvedValue({ id: 1 });

    const resultado = await conciertoService.unirsePorCodigo(YO, 1, "FANMEET2026");

    expect(resultado).toEqual({ ok: true, yaUnido: true });
    expect(usuariosConciertosRepository.crearRelacion).not.toHaveBeenCalled();
    expect(notificacionService.crear).not.toHaveBeenCalled();
  });

  it("crea la relación y notifica cuando el código es correcto y no estaba unido", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(CONCIERTO);
    usuariosConciertosRepository.existeRelacion.mockResolvedValue(null);

    const resultado = await conciertoService.unirsePorCodigo(YO, 1, "FANMEET2026");

    expect(usuariosConciertosRepository.crearRelacion).toHaveBeenCalledWith(YO, 1);
    expect(notificacionService.crear).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario: YO, tipo: "concierto_unido" })
    );
    expect(resultado).toEqual({ ok: true, yaUnido: false });
  });
});

describe("conciertoService.obtenerDetalle (autorización)", () => {
  it("rechaza con 404 si el concierto no existe", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(null);

    await expect(conciertoService.obtenerDetalle(YO, 1)).rejects.toMatchObject({ status: 404 });
    expect(usuariosConciertosRepository.existeRelacion).not.toHaveBeenCalled();
  });

  it("rechaza con 403 si el usuario no pertenece al concierto", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(CONCIERTO);
    usuariosConciertosRepository.existeRelacion.mockResolvedValue(null);

    await expect(conciertoService.obtenerDetalle(YO, 1)).rejects.toMatchObject({ status: 403 });
  });

  it("devuelve el detalle si el usuario pertenece al concierto", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(CONCIERTO);
    conciertoRepository.obtenerArtista.mockResolvedValue(null);
    conciertoRepository.obtenerEstadio.mockResolvedValue(null);
    grupoRepository.listarPorConcierto.mockResolvedValue([]);
    usuariosConciertosRepository.existeRelacion.mockResolvedValue({ id: 1 });
    usuariosConciertosRepository.listarUsuariosPorConcierto.mockResolvedValue([]);

    const resultado = await conciertoService.obtenerDetalle(YO, 1);

    expect(resultado.id_concierto).toBe(CONCIERTO.id_concierto);
  });
});

describe("conciertoService.salirDeConcierto", () => {
  it("saca al usuario de los grupos del concierto antes de sacarlo del concierto", async () => {
    grupoRepository.listarPorConcierto.mockResolvedValue([{ id_grupo: 1 }, { id_grupo: 2 }]);

    await conciertoService.salirDeConcierto(YO, 1);

    expect(grupoUsuarioRepository.eliminarDeGruposIds).toHaveBeenCalledWith(YO, [1, 2]);
    expect(usuariosConciertosRepository.eliminarRelacion).toHaveBeenCalledWith(YO, 1);
  });

  it("no llama a eliminarDeGruposIds si el concierto no tiene grupos", async () => {
    grupoRepository.listarPorConcierto.mockResolvedValue([]);

    await conciertoService.salirDeConcierto(YO, 1);

    expect(grupoUsuarioRepository.eliminarDeGruposIds).not.toHaveBeenCalled();
    expect(usuariosConciertosRepository.eliminarRelacion).toHaveBeenCalledWith(YO, 1);
  });
});
