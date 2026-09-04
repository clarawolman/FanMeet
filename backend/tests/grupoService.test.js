import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoRepository: {
    crear: vi.fn(),
    obtenerPorId: vi.fn(),
    listarPorConcierto: vi.fn(),
    eliminar: vi.fn(),
  },
  grupoUsuarioRepository: {
    existeRelacion: vi.fn(),
    crearRelacion: vi.fn(),
    eliminarRelacion: vi.fn(),
    eliminarTodosDeGrupo: vi.fn(),
    listarUsuariosPorGrupo: vi.fn(),
    listarGruposPorUsuario: vi.fn(),
  },
}));

vi.mock("../src/repositories/conciertoRepository.js", () => ({
  conciertoRepository: {
    obtenerPorId: vi.fn(),
    obtenerArtista: vi.fn(),
    obtenerEstadio: vi.fn(),
  },
  usuariosConciertosRepository: {
    existeRelacion: vi.fn(),
  },
}));

vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: {
    obtenerPorId: vi.fn(),
    listarPorIds: vi.fn(),
  },
}));

vi.mock("../src/services/notificacionService.js", () => ({
  notificacionService: { crear: vi.fn() },
}));

const { grupoRepository, grupoUsuarioRepository } = await import("../src/repositories/grupoRepository.js");
const { conciertoRepository, usuariosConciertosRepository } = await import(
  "../src/repositories/conciertoRepository.js"
);
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { notificacionService } = await import("../src/services/notificacionService.js");
const { grupoService } = await import("../src/services/grupoService.js");

const CREADOR = "creador-uuid";
const OTRO_USUARIO = "otro-uuid";
const GRUPO = { id_grupo: 1, id_creador: CREADOR, id_concierto: 10, nombre: "Previa" };

beforeEach(() => {
  vi.clearAllMocks();
  usuarioRepository.obtenerPorId.mockResolvedValue({ id_usuario: CREADOR, nombre: "Creador" });
  usuarioRepository.listarPorIds.mockResolvedValue([]);
  usuariosConciertosRepository.existeRelacion.mockResolvedValue({ id: 1 });
});

describe("grupoService.crear", () => {
  it("ignora cualquier id_creador que venga en el body y usa el del JWT", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue({ id_concierto: 10 });
    grupoRepository.crear.mockResolvedValue({ ...GRUPO });

    await grupoService.crear(CREADOR, { ...GRUPO, id_creador: OTRO_USUARIO });

    expect(grupoRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ id_creador: CREADOR })
    );
    expect(grupoUsuarioRepository.crearRelacion).toHaveBeenCalledWith(CREADOR, GRUPO.id_grupo);
  });

  it("rechaza con 404 si el concierto no existe", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(null);

    await expect(grupoService.crear(CREADOR, GRUPO)).rejects.toMatchObject({ status: 404 });
    expect(grupoRepository.crear).not.toHaveBeenCalled();
  });

  it("rechaza con 403 si el usuario no pertenece al concierto donde quiere crear el grupo", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue({ id_concierto: 10 });
    usuariosConciertosRepository.existeRelacion.mockResolvedValue(null);

    await expect(grupoService.crear(CREADOR, GRUPO)).rejects.toMatchObject({ status: 403 });
    expect(grupoRepository.crear).not.toHaveBeenCalled();
  });
});

describe("grupoService.obtenerDetalle (autorización)", () => {
  it("rechaza con 404 si el grupo no existe", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(null);

    await expect(grupoService.obtenerDetalle(OTRO_USUARIO, 999)).rejects.toMatchObject({
      status: 404,
    });
    expect(usuariosConciertosRepository.existeRelacion).not.toHaveBeenCalled();
  });

  it("rechaza con 403 si el usuario no pertenece al concierto del grupo", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(GRUPO);
    usuariosConciertosRepository.existeRelacion.mockResolvedValue(null);

    await expect(grupoService.obtenerDetalle(OTRO_USUARIO, GRUPO.id_grupo)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("devuelve el detalle si el usuario pertenece al concierto del grupo", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(GRUPO);
    usuariosConciertosRepository.existeRelacion.mockResolvedValue({ id: 1 });
    grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([]);

    const resultado = await grupoService.obtenerDetalle(OTRO_USUARIO, GRUPO.id_grupo);

    expect(usuariosConciertosRepository.existeRelacion).toHaveBeenCalledWith(
      OTRO_USUARIO,
      GRUPO.id_concierto
    );
    expect(resultado.id_grupo).toBe(GRUPO.id_grupo);
  });
});

describe("grupoService.eliminar (autorización)", () => {
  it("rechaza con 403 si quien pide borrar no es el creador", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(GRUPO);

    await expect(grupoService.eliminar(OTRO_USUARIO, GRUPO.id_grupo)).rejects.toMatchObject({
      status: 403,
    });
    expect(grupoRepository.eliminar).not.toHaveBeenCalled();
    expect(grupoUsuarioRepository.eliminarTodosDeGrupo).not.toHaveBeenCalled();
  });

  it("permite borrar (grupo + participantes) si quien pide es el creador", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(GRUPO);

    const resultado = await grupoService.eliminar(CREADOR, GRUPO.id_grupo);

    expect(grupoUsuarioRepository.eliminarTodosDeGrupo).toHaveBeenCalledWith(GRUPO.id_grupo);
    expect(grupoRepository.eliminar).toHaveBeenCalledWith(GRUPO.id_grupo);
    expect(resultado).toEqual({ ok: true });
  });

  it("rechaza con 404 si el grupo no existe", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(null);

    await expect(grupoService.eliminar(CREADOR, 999)).rejects.toMatchObject({ status: 404 });
  });
});

describe("grupoService.unirse", () => {
  it("es idempotente: si ya está confirmado no vuelve a insertar ni notificar", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(GRUPO);
    grupoUsuarioRepository.existeRelacion.mockResolvedValue({ id: 1 });

    const resultado = await grupoService.unirse(OTRO_USUARIO, GRUPO.id_grupo);

    expect(resultado).toEqual({ ok: true, yaConfirmado: true });
    expect(grupoUsuarioRepository.crearRelacion).not.toHaveBeenCalled();
    expect(notificacionService.crear).not.toHaveBeenCalled();
  });

  it("crea la relación y notifica al usuario que se une", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(GRUPO);
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);

    const resultado = await grupoService.unirse(OTRO_USUARIO, GRUPO.id_grupo);

    expect(grupoUsuarioRepository.crearRelacion).toHaveBeenCalledWith(OTRO_USUARIO, GRUPO.id_grupo);
    expect(notificacionService.crear).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario: OTRO_USUARIO, tipo: "grupo_unido" })
    );
    expect(resultado).toEqual({ ok: true, yaConfirmado: false });
  });
});

describe("grupoService.salir", () => {
  it("solo borra la relación del propio usuario autenticado", async () => {
    await grupoService.salir(OTRO_USUARIO, GRUPO.id_grupo);
    expect(grupoUsuarioRepository.eliminarRelacion).toHaveBeenCalledWith(OTRO_USUARIO, GRUPO.id_grupo);
  });
});
