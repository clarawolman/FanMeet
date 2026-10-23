import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoRepository: {
    crear: vi.fn(),
    obtenerPorId: vi.fn(),
    listarPorConcierto: vi.fn(),
    eliminar: vi.fn(),
    actualizar: vi.fn(),
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
    listarDeArtistaYEstadio: vi.fn(),
  },
  usuariosConciertosRepository: {
    existeRelacion: vi.fn(),
    existeRelacionEnAlguno: vi.fn(),
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

vi.mock("../src/services/avisoCambiosGrupo.js", () => ({
  avisarCambiosDeGrupo: vi.fn(async () => 0),
}));

const { grupoRepository, grupoUsuarioRepository } = await import("../src/repositories/grupoRepository.js");
const { conciertoRepository, usuariosConciertosRepository } = await import(
  "../src/repositories/conciertoRepository.js"
);
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { notificacionService } = await import("../src/services/notificacionService.js");
const { grupoService } = await import("../src/services/grupoService.js");
const { avisarCambiosDeGrupo } = await import("../src/services/avisoCambiosGrupo.js");

const CREADOR = "creador-uuid";
const OTRO_USUARIO = "otro-uuid";
const GRUPO = {
  id_grupo: 1,
  id_creador: CREADOR,
  id_concierto: 10,
  nombre: "Previa",
  categoria: "pre",
  fecha: "2099-10-20",
  hora: "18:00:00",
  ubicacion: "Plaza Serrano",
};

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

  it("no deja sumarse a quien no está unido al concierto del grupo", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(GRUPO);
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);
    usuariosConciertosRepository.existeRelacion.mockResolvedValue(null);

    await expect(grupoService.unirse(OTRO_USUARIO, GRUPO.id_grupo)).rejects.toMatchObject({ status: 403 });
    expect(usuariosConciertosRepository.existeRelacion).toHaveBeenCalledWith(OTRO_USUARIO, GRUPO.id_concierto);
    expect(grupoUsuarioRepository.crearRelacion).not.toHaveBeenCalled();
  });
});

describe("grupoService.salir", () => {
  it("solo borra la relación del propio usuario autenticado", async () => {
    await grupoService.salir(OTRO_USUARIO, GRUPO.id_grupo);
    expect(grupoUsuarioRepository.eliminarRelacion).toHaveBeenCalledWith(OTRO_USUARIO, GRUPO.id_grupo);
  });
});

describe("grupoService.actualizar", () => {
  beforeEach(() => {
    grupoRepository.obtenerPorId.mockResolvedValue({ ...GRUPO });
    grupoRepository.actualizar.mockImplementation(async (id, cambios) => ({ ...GRUPO, ...cambios }));
    grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([]);
  });

  it("el creador puede cambiar los datos de su grupo", async () => {
    const grupo = await grupoService.actualizar(CREADOR, 1, { hora: "19:30", ubicacion: "Parque Los Andes" });

    expect(grupoRepository.actualizar).toHaveBeenCalledWith(1, { hora: "19:30", ubicacion: "Parque Los Andes" });
    expect(grupo).toMatchObject({ id_grupo: 1, hora: "19:30", usuarios: [] });
  });

  it("avisa el cambio a los integrantes, menos al creador", async () => {
    await grupoService.actualizar(CREADOR, 1, { hora: "19:30" });

    expect(avisarCambiosDeGrupo).toHaveBeenCalledWith(
      GRUPO,
      expect.objectContaining({ hora: "19:30" }),
      { excepto: CREADOR }
    );
  });

  it("rechaza con 403 si no es el creador", async () => {
    await expect(grupoService.actualizar(OTRO_USUARIO, 1, { nombre: "Mío" })).rejects.toMatchObject({ status: 403 });
    expect(grupoRepository.actualizar).not.toHaveBeenCalled();
    expect(avisarCambiosDeGrupo).not.toHaveBeenCalled();
  });

  it("rechaza con 404 si el grupo no existe", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(null);
    await expect(grupoService.actualizar(CREADOR, 1, { nombre: "X" })).rejects.toMatchObject({ status: 404 });
  });

  it("pasa el nombre nuevo por el filtro de malas palabras", async () => {
    await expect(grupoService.actualizar(CREADOR, 1, { nombre: "previa de mierda" })).rejects.toMatchObject({
      status: 400,
    });
    expect(grupoRepository.actualizar).not.toHaveBeenCalled();
  });
});

describe("cupo del grupo", () => {
  beforeEach(() => {
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);
    grupoRepository.actualizar.mockImplementation(async (id, cambios) => ({ ...GRUPO, ...cambios }));
  });

  it("no deja unirse si el grupo está completo", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ ...GRUPO, cupo: 2 });
    grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([{ id_usuario: "a" }, { id_usuario: "b" }]);

    await expect(grupoService.unirse(OTRO_USUARIO, 1)).rejects.toMatchObject({ status: 409 });
    expect(grupoUsuarioRepository.crearRelacion).not.toHaveBeenCalled();
  });

  it("deja unirse si queda lugar", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ ...GRUPO, cupo: 3 });
    grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([{ id_usuario: "a" }, { id_usuario: "b" }]);

    await grupoService.unirse(OTRO_USUARIO, 1);
    expect(grupoUsuarioRepository.crearRelacion).toHaveBeenCalledWith(OTRO_USUARIO, 1);
  });

  it("sin cupo no cuenta integrantes", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ ...GRUPO, cupo: null });

    await grupoService.unirse(OTRO_USUARIO, 1);
    expect(grupoUsuarioRepository.listarUsuariosPorGrupo).not.toHaveBeenCalled();
    expect(grupoUsuarioRepository.crearRelacion).toHaveBeenCalled();
  });

  it("el creador no puede bajar el cupo por debajo de los integrantes", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ ...GRUPO });
    grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([{}, {}, {}]);

    await expect(grupoService.actualizar(CREADOR, 1, { cupo: 2 })).rejects.toMatchObject({ status: 400 });
    expect(grupoRepository.actualizar).not.toHaveBeenCalled();
  });

  it("el creador puede sacar el límite", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ ...GRUPO, cupo: 4 });
    grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([]);

    await grupoService.actualizar(CREADOR, 1, { cupo: null });
    expect(grupoRepository.actualizar).toHaveBeenCalledWith(1, { cupo: null });
  });
});

describe("grupos generales (varias fechas seguidas)", () => {
  const fecha = (id, dia) => ({ id_concierto: id, id_artista: 1, id_estadio: 1, fecha: `${dia}T21:00:00` });
  const FECHAS = [fecha(13, "2099-11-13"), fecha(14, "2099-11-14"), fecha(15, "2099-11-15"), fecha(20, "2099-12-20")];
  const NUEVO = { nombre: "Fans de MB", categoria: "comunidad", fecha: null, hora: null, ubicacion: null };

  beforeEach(() => {
    conciertoRepository.listarDeArtistaYEstadio.mockResolvedValue(FECHAS);
    grupoRepository.crear.mockImplementation(async (datos) => ({ id_grupo: 7, ...datos }));
  });

  it("se crea desde cualquier fecha y queda guardado con la primera como concierto", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(FECHAS[2]);

    await grupoService.crear(CREADOR, { ...NUEVO, id_concierto: 15, ids_conciertos: [13, 14, 15] });

    expect(grupoRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ id_concierto: 13, ids_conciertos: [13, 14, 15], id_creador: CREADOR })
    );
  });

  it("no deja sumar fechas que no son seguidas", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(FECHAS[0]);

    await expect(
      grupoService.crear(CREADOR, { ...NUEVO, id_concierto: 13, ids_conciertos: [13, 20] })
    ).rejects.toMatchObject({ status: 400 });
    expect(grupoRepository.crear).not.toHaveBeenCalled();
  });

  it("un grupo de una sola fecha queda sin ids_conciertos", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(FECHAS[0]);

    await grupoService.crear(CREADOR, { ...NUEVO, id_concierto: 13 });

    expect(grupoRepository.crear).toHaveBeenCalledWith(expect.objectContaining({ id_concierto: 13, ids_conciertos: null }));
  });

  it("puede sumarse quien está unido a otra de sus fechas", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ ...GRUPO, id_concierto: 13, ids_conciertos: [13, 14, 15] });
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);
    usuariosConciertosRepository.existeRelacionEnAlguno.mockResolvedValue(true);

    const resultado = await grupoService.unirse(OTRO_USUARIO, GRUPO.id_grupo);

    expect(usuariosConciertosRepository.existeRelacionEnAlguno).toHaveBeenCalledWith(OTRO_USUARIO, [13, 14, 15]);
    expect(resultado).toEqual({ ok: true, yaConfirmado: false });
  });

  it("pasarlo a comunidad le saca el encuentro; volver a juntarse exige completarlo", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(GRUPO);
    grupoRepository.actualizar.mockImplementation(async (id, cambios) => ({ ...GRUPO, ...cambios }));

    await grupoService.actualizar(CREADOR, GRUPO.id_grupo, { categoria: "comunidad" });
    expect(grupoRepository.actualizar).toHaveBeenCalledWith(GRUPO.id_grupo, {
      categoria: "comunidad",
      fecha: null,
      hora: null,
      ubicacion: null,
    });

    grupoRepository.obtenerPorId.mockResolvedValue({ ...GRUPO, categoria: "comunidad", fecha: null, hora: null, ubicacion: null });
    await expect(grupoService.actualizar(CREADOR, GRUPO.id_grupo, { categoria: "pre" })).rejects.toMatchObject({
      status: 400,
    });
  });
});
