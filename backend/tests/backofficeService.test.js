import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/backofficeRepository.js", () => ({
  backofficeRepository: {
    crearNotificaciones: vi.fn(),
    actualizarConcierto: vi.fn(),
    obtenerOCrearArtista: vi.fn(),
    crearConcierto: vi.fn(),
    eliminarConcierto: vi.fn(),
    cambiarEstadoUsuario: vi.fn(),
    banearEnAuth: vi.fn(),
  },
}));
vi.mock("../src/repositories/reporteRepository.js", () => ({
  reporteRepository: { obtenerPorId: vi.fn(), resolver: vi.fn(), listarDeUsuario: vi.fn() },
}));
vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: { obtenerPorId: vi.fn(), listarPorIds: vi.fn(async () => []) },
}));
vi.mock("../src/repositories/conciertoRepository.js", () => ({
  conciertoRepository: { obtenerPorId: vi.fn() },
  usuariosConciertosRepository: { listarUsuariosPorConcierto: vi.fn() },
}));
vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoRepository: { listarPorIds: vi.fn(async () => []), obtenerPorId: vi.fn(), actualizar: vi.fn() },
  grupoUsuarioRepository: {},
}));
vi.mock("../src/repositories/mensajeRepository.js", () => ({ mensajeRepository: {} }));
vi.mock("../src/repositories/mensajePrivadoRepository.js", () => ({ mensajePrivadoRepository: {} }));
vi.mock("../src/repositories/estiloMusicalRepository.js", () => ({ estiloMusicalRepository: {} }));
vi.mock("../src/services/avisoCambiosGrupo.js", () => ({
  avisarCambiosDeGrupo: vi.fn(async () => 3),
}));
vi.mock("../src/repositories/artistaFavoritoRepository.js", () => ({
  artistaFavoritoRepository: { listarTodos: vi.fn(), listarPorSpotifyId: vi.fn() },
}));

const { backofficeRepository } = await import("../src/repositories/backofficeRepository.js");
const { reporteRepository } = await import("../src/repositories/reporteRepository.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { conciertoRepository, usuariosConciertosRepository } = await import(
  "../src/repositories/conciertoRepository.js"
);
const { grupoRepository } = await import("../src/repositories/grupoRepository.js");
const { artistaFavoritoRepository } = await import("../src/repositories/artistaFavoritoRepository.js");
const { backofficeService } = await import("../src/services/backofficeService.js");
const { env } = await import("../src/config/env.js");

const CONCIERTO = { id_concierto: 4, nombre: "Short N Sweet Tour", fecha: "2026-08-28T21:00:00" };

function unidos(cantidad) {
  return Array.from({ length: cantidad }, (_, i) => ({ id_usuario: `u${i}`, id_concierto: 4 }));
}

beforeEach(() => {
  vi.clearAllMocks();
  conciertoRepository.obtenerPorId.mockResolvedValue(CONCIERTO);
  backofficeRepository.actualizarConcierto.mockImplementation(async (_id, cambios) => ({
    ...CONCIERTO,
    ...cambios,
  }));
});

describe("backofficeService.actualizarConcierto", () => {
  it("avisa a todos los unidos si son al menos el mínimo", async () => {
    usuariosConciertosRepository.listarUsuariosPorConcierto.mockResolvedValue(
      unidos(env.minimoUnidosParaNotificar)
    );

    const { aviso } = await backofficeService.actualizarConcierto(4, { fecha: "2026-08-29T21:00" });

    expect(aviso.notificados).toBe(env.minimoUnidosParaNotificar);
    const filas = backofficeRepository.crearNotificaciones.mock.calls[0][0];
    expect(filas).toHaveLength(env.minimoUnidosParaNotificar);
    expect(filas[0]).toMatchObject({ tipo: "novedad_concierto", id_concierto: 4 });
    expect(filas[0].descripcion).toContain("la fecha y hora");
  });

  it("no avisa si hay pocos unidos", async () => {
    usuariosConciertosRepository.listarUsuariosPorConcierto.mockResolvedValue(unidos(2));

    const { aviso } = await backofficeService.actualizarConcierto(4, { fecha: "2026-08-29T21:00" });

    expect(aviso.notificados).toBe(0);
    expect(backofficeRepository.crearNotificaciones).not.toHaveBeenCalled();
  });

  it("no avisa si en realidad no cambió nada", async () => {
    usuariosConciertosRepository.listarUsuariosPorConcierto.mockResolvedValue(unidos(50));

    await backofficeService.actualizarConcierto(4, { nombre: CONCIERTO.nombre });

    expect(backofficeRepository.crearNotificaciones).not.toHaveBeenCalled();
  });
});

describe("backofficeService.crearConcierto", () => {
  beforeEach(() => {
    backofficeRepository.obtenerOCrearArtista.mockResolvedValue({ id_artista: 7, nombre: "Tini" });
    backofficeRepository.crearConcierto.mockImplementation(async (datos) => ({ ...CONCIERTO, ...datos }));
  });

  it("avisa una vez a cada usuario que sigue al artista, sin importar mayúsculas ni tildes", async () => {
    artistaFavoritoRepository.listarTodos.mockResolvedValue([
      { id_usuario: "u1", spotify_id: "a", nombre: "TINI" },
      { id_usuario: "u2", spotify_id: "a", nombre: "Tiní" },
      { id_usuario: "u2", spotify_id: "b", nombre: "tini" },
      { id_usuario: "u3", spotify_id: "c", nombre: "Lali" },
    ]);

    const concierto = await backofficeService.crearConcierto({ artista: "Tini", nombre: "Futttura" });

    expect(concierto.id_artista).toBe(7);
    const filas = backofficeRepository.crearNotificaciones.mock.calls[0][0];
    expect(filas.map((f) => f.id_usuario)).toEqual(["u1", "u2"]);
    expect(filas[0]).toMatchObject({ tipo: "novedad_concierto", id_concierto: CONCIERTO.id_concierto });
  });

  it("si el artista está vinculado a Spotify, busca a los seguidores por id", async () => {
    backofficeRepository.obtenerOCrearArtista.mockResolvedValue({
      id_artista: 8,
      nombre: "Duki",
      spotify_id: "1bAftSH8umNcGZ0uyV7LMg",
    });
    artistaFavoritoRepository.listarPorSpotifyId.mockResolvedValue([{ id_usuario: "u9" }]);

    await backofficeService.crearConcierto({
      artista: "Duki",
      artista_spotify_id: "1bAftSH8umNcGZ0uyV7LMg",
      nombre: "Ameri Tour",
    });

    expect(backofficeRepository.obtenerOCrearArtista).toHaveBeenCalledWith("Duki", "1bAftSH8umNcGZ0uyV7LMg");
    // El id de Spotify va en la tabla artista, no en concierto.
    expect(backofficeRepository.crearConcierto.mock.calls[0][0]).not.toHaveProperty("artista_spotify_id");
    expect(artistaFavoritoRepository.listarPorSpotifyId).toHaveBeenCalledWith("1bAftSH8umNcGZ0uyV7LMg");
    expect(artistaFavoritoRepository.listarTodos).not.toHaveBeenCalled();
    expect(backofficeRepository.crearNotificaciones.mock.calls[0][0].map((n) => n.id_usuario)).toEqual(["u9"]);
  });

  it("si falla el aviso, el concierto igual se crea", async () => {
    artistaFavoritoRepository.listarTodos.mockRejectedValue(new Error("se cayó la base"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const concierto = await backofficeService.crearConcierto({ artista: "Tini", nombre: "Futttura" });

    expect(concierto.id_artista).toBe(7);
  });
});

describe("backofficeService.eliminarConcierto", () => {
  it("borra el concierto y avisa a todos los unidos, sin link al concierto", async () => {
    usuariosConciertosRepository.listarUsuariosPorConcierto.mockResolvedValue(unidos(2));

    const resultado = await backofficeService.eliminarConcierto(4);

    expect(backofficeRepository.eliminarConcierto).toHaveBeenCalledWith(4);
    const filas = backofficeRepository.crearNotificaciones.mock.calls[0][0];
    expect(filas.map((f) => f.id_usuario)).toEqual(["u0", "u1"]);
    expect(filas[0].titulo).toMatch(/Se canceló/);
    expect(filas[0]).not.toHaveProperty("id_concierto");
    expect(resultado).toEqual({ ok: true, notificados: 2 });
  });

  it("responde 404 si el concierto no existe", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(null);

    await expect(backofficeService.eliminarConcierto(99)).rejects.toMatchObject({ status: 404 });
    expect(backofficeRepository.eliminarConcierto).not.toHaveBeenCalled();
  });
});

describe("backofficeService.resolverReporte", () => {
  const REPORTE = { id_reporte: 7, id_reportante: "a", id_reportado: "b", estado: "pendiente", motivo: "insultos" };

  beforeEach(() => {
    reporteRepository.obtenerPorId.mockResolvedValue(REPORTE);
    reporteRepository.resolver.mockImplementation(async (_id, { estado }) => ({ ...REPORTE, estado }));
    usuarioRepository.obtenerPorId.mockResolvedValue({ id_usuario: "b", rol: "usuario" });
    backofficeRepository.cambiarEstadoUsuario.mockResolvedValue({ id_usuario: "b", estado: "suspendido" });
  });

  it("sancionar suspende al usuario reportado", async () => {
    const resultado = await backofficeService.resolverReporte("mod", 7, { decision: "sancionar" });

    expect(backofficeRepository.cambiarEstadoUsuario).toHaveBeenCalledWith("b", {
      estado: "suspendido",
      motivo: "insultos",
    });
    expect(backofficeRepository.banearEnAuth).toHaveBeenCalledWith("b", true);
    expect(resultado.estado).toBe("sancionado");
  });

  it("descartar no toca al usuario", async () => {
    const resultado = await backofficeService.resolverReporte("mod", 7, { decision: "descartar" });

    expect(backofficeRepository.cambiarEstadoUsuario).not.toHaveBeenCalled();
    expect(resultado.estado).toBe("descartado");
  });

  it("un moderador no se puede suspender a sí mismo", async () => {
    await expect(
      backofficeService.cambiarEstadoUsuario("b", "b", { estado: "suspendido", motivo: "x" })
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("backofficeService.actualizarGrupo", () => {
  beforeEach(() => {
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 9, nombre: "Previa", foto: "https://x.com/a.jpg" });
    grupoRepository.actualizar.mockImplementation(async (id, cambios) => ({ id_grupo: id, ...cambios }));
  });

  it("guarda solo los campos que llegan y avisa a los integrantes", async () => {
    const resultado = await backofficeService.actualizarGrupo(9, { nombre: "Previa nueva", hora: "19:00" });
    expect(grupoRepository.actualizar).toHaveBeenCalledWith(9, { nombre: "Previa nueva", hora: "19:00" });
    expect(resultado).toMatchObject({ grupo: { id_grupo: 9, nombre: "Previa nueva" }, notificados: 3 });
  });

  it("foto vacía le saca la foto al grupo", async () => {
    await backofficeService.actualizarGrupo(9, { foto: "" });
    expect(grupoRepository.actualizar).toHaveBeenCalledWith(9, { foto: null });
  });

  it("si el grupo no existe responde 404", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(null);
    await expect(backofficeService.actualizarGrupo(9, { nombre: "X" })).rejects.toMatchObject({ status: 404 });
    expect(grupoRepository.actualizar).not.toHaveBeenCalled();
  });

  it("si lo pasan a un concierto que no existe responde 404", async () => {
    conciertoRepository.obtenerPorId.mockResolvedValue(null);
    await expect(backofficeService.actualizarGrupo(9, { id_concierto: 99 })).rejects.toMatchObject({ status: 404 });
    expect(grupoRepository.actualizar).not.toHaveBeenCalled();
  });
});
