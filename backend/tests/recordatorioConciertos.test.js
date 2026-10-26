import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/conciertoRepository.js", () => ({
  conciertoRepository: { listarDelDia: vi.fn() },
  usuariosConciertosRepository: { listarUsuariosPorConcierto: vi.fn() },
}));
vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoRepository: { listarPorConcierto: vi.fn() },
  grupoUsuarioRepository: { listarUsuariosPorGrupos: vi.fn() },
}));
vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: { listarIdsSuspendidos: vi.fn(), listarPorIds: vi.fn() },
}));
vi.mock("../src/repositories/notificacionRepository.js", () => ({
  notificacionRepository: { crearVarias: vi.fn() },
}));
vi.mock("../src/repositories/recordatorioRepository.js", () => ({
  recordatorioRepository: { reservar: vi.fn(), liberar: vi.fn() },
}));

const { conciertoRepository, usuariosConciertosRepository } = await import(
  "../src/repositories/conciertoRepository.js"
);
const { grupoRepository, grupoUsuarioRepository } = await import(
  "../src/repositories/grupoRepository.js"
);
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { notificacionRepository } = await import("../src/repositories/notificacionRepository.js");
const { recordatorioRepository } = await import("../src/repositories/recordatorioRepository.js");
const { enviarRecordatoriosDeHoy, textoRecordatorio } = await import(
  "../src/services/recordatorioConciertos.js"
);

// 20/10/2026 a las 13:00 UTC = 10:00 en Argentina.
const AHORA = new Date("2026-10-20T13:00:00Z");
const HOY = "2026-10-20";

const CONCIERTO = {
  id_concierto: 9,
  nombre: "Iron Maiden",
  fecha: "2026-10-20T21:00:00",
  imagenConcierto: "maiden.jpg",
  estadio: { nombre: "Estadio River" },
};

const PREVIA = {
  id_grupo: 7,
  id_concierto: 9,
  nombre: "Previa",
  fecha: "2026-10-20",
  hora: "18:00:00",
  ubicacion: "Parque Patricios",
};
const AFTER = { ...PREVIA, id_grupo: 8, nombre: "After", fecha: "2026-10-21", hora: "01:30:00", ubicacion: "Bar X" };

beforeEach(() => {
  vi.clearAllMocks();
  conciertoRepository.listarDelDia.mockResolvedValue([CONCIERTO]);
  usuariosConciertosRepository.listarUsuariosPorConcierto.mockResolvedValue([
    { id_usuario: "fan1" },
    { id_usuario: "fan2" },
    { id_usuario: "suspendido" },
  ]);
  grupoRepository.listarPorConcierto.mockResolvedValue([PREVIA, AFTER]);
  grupoUsuarioRepository.listarUsuariosPorGrupos.mockResolvedValue([{ id_grupo: 7, id_usuario: "fan1" }]);
  usuarioRepository.listarIdsSuspendidos.mockResolvedValue(new Set(["suspendido"]));
  // Sin preferencias guardadas: el recordatorio llega el mismo día
  usuarioRepository.listarPorIds.mockResolvedValue([]);
  // Por defecto, ninguno se había mandado: se reservan todos los pedidos.
  recordatorioRepository.reservar.mockImplementation(async (filas) =>
    filas.map((f) => ({ id_usuario: f.id_usuario }))
  );
});

describe("textoRecordatorio", () => {
  it("dice el show, la hora y el estadio", () => {
    expect(textoRecordatorio(CONCIERTO, [], HOY)).toBe("Hoy es Iron Maiden, a las 21:00 en Estadio River.");
  });

  it("suma los datos del grupo", () => {
    expect(textoRecordatorio(CONCIERTO, [PREVIA], HOY)).toBe(
      "Hoy es Iron Maiden, a las 21:00 en Estadio River. Tu grupo «Previa» a las 18:00 en Parque Patricios."
    );
  });

  it("con varios grupos los lista, con el día si no es hoy", () => {
    expect(textoRecordatorio(CONCIERTO, [PREVIA, AFTER], HOY)).toBe(
      "Hoy es Iron Maiden, a las 21:00 en Estadio River. Tus grupos: «Previa» a las 18:00 en Parque Patricios y «After» el 21/10 a las 01:30 en Bar X."
    );
  });

  it("sin estadio no lo menciona", () => {
    expect(textoRecordatorio({ ...CONCIERTO, estadio: null }, [], HOY)).toBe("Hoy es Iron Maiden, a las 21:00.");
  });
});

describe("enviarRecordatoriosDeHoy", () => {
  it("busca los conciertos de hoy en hora de Argentina", async () => {
    await enviarRecordatoriosDeHoy({ ahora: AHORA });
    expect(conciertoRepository.listarDelDia).toHaveBeenCalledWith("2026-10-20", "2026-10-21");
  });

  it("notifica a los unidos (no a los suspendidos) y suma el grupo a quien está en uno", async () => {
    const enviados = await enviarRecordatoriosDeHoy({ ahora: AHORA });

    expect(enviados).toBe(2);
    expect(recordatorioRepository.reservar).toHaveBeenCalledWith([
      { id_concierto: 9, id_usuario: "fan1", fecha: HOY },
      { id_concierto: 9, id_usuario: "fan2", fecha: HOY },
    ]);
    const filas = notificacionRepository.crearVarias.mock.calls[0][0];
    expect(filas).toHaveLength(2);
    expect(filas[0]).toMatchObject({
      id_usuario: "fan1",
      tipo: "recordatorio_concierto",
      id_concierto: 9,
      id_grupo: 7,
      imagen: "maiden.jpg",
    });
    expect(filas[0].descripcion).toContain("Tu grupo «Previa»");
    expect(filas[1]).toMatchObject({ id_usuario: "fan2", id_grupo: null });
    expect(filas[1].descripcion).not.toContain("grupo");
  });

  it("no repite: solo notifica a los que se pudieron reservar", async () => {
    recordatorioRepository.reservar.mockResolvedValue([{ id_usuario: "fan2" }]);
    const enviados = await enviarRecordatoriosDeHoy({ ahora: AHORA });

    expect(enviados).toBe(1);
    const filas = notificacionRepository.crearVarias.mock.calls[0][0];
    expect(filas.map((f) => f.id_usuario)).toEqual(["fan2"]);
  });

  it("si ya se mandaron todos, no crea notificaciones", async () => {
    recordatorioRepository.reservar.mockResolvedValue([]);
    expect(await enviarRecordatoriosDeHoy({ ahora: AHORA })).toBe(0);
    expect(notificacionRepository.crearVarias).not.toHaveBeenCalled();
  });

  it("si falla la notificación, libera la reserva para reintentar", async () => {
    notificacionRepository.crearVarias.mockRejectedValue(new Error("caída"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    recordatorioRepository.liberar.mockResolvedValue();

    expect(await enviarRecordatoriosDeHoy({ ahora: AHORA })).toBe(0);
    expect(recordatorioRepository.liberar).toHaveBeenCalledWith(9, HOY, ["fan1", "fan2"]);
  });

  it("con aviso anticipado, a quien lo pidió le llega un día antes", async () => {
    notificacionRepository.crearVarias.mockResolvedValue();
    conciertoRepository.listarDelDia.mockImplementation(async (dia) =>
      dia === "2026-10-21" ? [{ ...CONCIERTO, fecha: "2026-10-21T21:00:00" }] : []
    );
    usuarioRepository.listarPorIds.mockResolvedValue([
      { id_usuario: "fan1", preferencias: { recordatorio_dias: [0, 1] } },
    ]);

    expect(await enviarRecordatoriosDeHoy({ ahora: AHORA })).toBe(1);
    const filas = notificacionRepository.crearVarias.mock.calls[0][0];
    expect(filas).toEqual([
      expect.objectContaining({ id_usuario: "fan1", titulo: "¡Mañana es el show!" }),
    ]);
    expect(filas[0].descripcion).toMatch(/^Mañana es Iron Maiden, a las 21:00/);
  });

  it("antes de las 9 de Argentina no manda nada", async () => {
    // 11:00 UTC = 08:00 en Argentina.
    expect(await enviarRecordatoriosDeHoy({ ahora: new Date("2026-10-20T11:00:00Z") })).toBe(0);
    expect(conciertoRepository.listarDelDia).not.toHaveBeenCalled();
  });
});
