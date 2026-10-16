import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/backofficeRepository.js", () => ({
  backofficeRepository: {
    crearNotificaciones: vi.fn(),
    actualizarConcierto: vi.fn(),
    obtenerOCrearArtista: vi.fn(),
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
  grupoRepository: { listarPorIds: vi.fn(async () => []) },
  grupoUsuarioRepository: {},
}));
vi.mock("../src/repositories/mensajeRepository.js", () => ({ mensajeRepository: {} }));
vi.mock("../src/repositories/mensajePrivadoRepository.js", () => ({ mensajePrivadoRepository: {} }));
vi.mock("../src/repositories/estiloMusicalRepository.js", () => ({ estiloMusicalRepository: {} }));

const { backofficeRepository } = await import("../src/repositories/backofficeRepository.js");
const { reporteRepository } = await import("../src/repositories/reporteRepository.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { conciertoRepository, usuariosConciertosRepository } = await import(
  "../src/repositories/conciertoRepository.js"
);
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
