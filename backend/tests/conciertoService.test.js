import { describe, it, expect, vi, beforeEach } from "vitest";

// Sin bloqueos, salvo que el test diga otra cosa.
vi.mock("../src/repositories/bloqueoRepository.js", () => ({
  bloqueoRepository: {
    idsConBloqueo: vi.fn(async () => new Set()),
    existeEntre: vi.fn(async () => false),
  },
}));

vi.mock("../src/repositories/conciertoRepository.js", () => ({
  conciertoRepository: {
    listarTodos: vi.fn(),
    obtenerPorId: vi.fn(),
    obtenerArtista: vi.fn(),
    obtenerEstadio: vi.fn(),
    listarDeArtistaYEstadio: vi.fn(),
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

vi.mock("../src/repositories/amistadRepository.js", () => ({
  amistadRepository: { listarDeUsuario: vi.fn().mockResolvedValue([]) },
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
  usuariosConciertosRepository.listarConciertosPorUsuario.mockResolvedValue([]);
  conciertoRepository.listarDeArtistaYEstadio.mockResolvedValue([]);
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

  it("no deja unirse a un concierto que ya pasó", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue({ ...CONCIERTO, fecha: "2020-01-01T21:00:00" });
    usuariosConciertosRepository.existeRelacion.mockResolvedValue(null);

    await expect(conciertoService.unirsePorCodigo(YO, 1, "FANMEET2026")).rejects.toMatchObject({
      status: 400,
    });
    expect(usuariosConciertosRepository.crearRelacion).not.toHaveBeenCalled();
  });
});

describe("conciertoService.listar", () => {
  it("pide solo los conciertos que no pasaron", async () => {
    conciertoRepository.listarTodos.mockResolvedValue([]);
    await conciertoService.listar();
    expect(conciertoRepository.listarTodos).toHaveBeenCalledWith({ soloProximos: true });
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

  it("trae las fechas seguidas del artista en ese estadio que no pasaron", async () => {
    const fecha = (id, dia) => ({ id_concierto: id, id_artista: 1, id_estadio: 1, fecha: `${dia}T21:00:00` });
    conciertoRepository.obtenerPorId.mockResolvedValue(fecha(1, "2099-11-13"));
    conciertoRepository.listarDeArtistaYEstadio.mockResolvedValue([
      fecha(1, "2099-11-13"),
      fecha(2, "2099-11-14"),
      fecha(3, "2099-11-15"),
      fecha(4, "2099-12-20"),
    ]);
    grupoRepository.listarPorConcierto.mockResolvedValue([]);
    usuariosConciertosRepository.existeRelacion.mockResolvedValue({ id: 1 });
    usuariosConciertosRepository.listarUsuariosPorConcierto.mockResolvedValue([]);

    const resultado = await conciertoService.obtenerDetalle(YO, 1);

    expect(resultado.fechasSeguidas.map((c) => c.id_concierto)).toEqual([1, 2, 3]);
  });
});

describe("conciertoService.salirDeConcierto", () => {
  it("saca al usuario de los grupos del concierto antes de sacarlo del concierto", async () => {
    grupoRepository.listarPorConcierto.mockResolvedValue([{ id_grupo: 1 }, { id_grupo: 2 }]);

    await conciertoService.salirDeConcierto(YO, 1);

    expect(grupoUsuarioRepository.eliminarDeGruposIds).toHaveBeenCalledWith(YO, [1, 2]);
    expect(usuariosConciertosRepository.eliminarRelacion).toHaveBeenCalledWith(YO, 1);
  });

  it("en un grupo general sigue si todavía va a otra de sus fechas", async () => {
    grupoRepository.listarPorConcierto.mockResolvedValue([
      { id_grupo: 1, id_concierto: 1 },
      { id_grupo: 2, id_concierto: 1, ids_conciertos: [1, 2, 3] },
      { id_grupo: 3, id_concierto: 1, ids_conciertos: [1, 2] },
    ]);
    usuariosConciertosRepository.listarConciertosPorUsuario.mockResolvedValue([
      { id_concierto: 1 },
      { id_concierto: 3 },
    ]);

    await conciertoService.salirDeConcierto(YO, 1);

    expect(grupoUsuarioRepository.eliminarDeGruposIds).toHaveBeenCalledWith(YO, [1, 3]);
  });

  it("no llama a eliminarDeGruposIds si el concierto no tiene grupos", async () => {
    grupoRepository.listarPorConcierto.mockResolvedValue([]);

    await conciertoService.salirDeConcierto(YO, 1);

    expect(grupoUsuarioRepository.eliminarDeGruposIds).not.toHaveBeenCalled();
    expect(usuariosConciertosRepository.eliminarRelacion).toHaveBeenCalledWith(YO, 1);
  });
});
