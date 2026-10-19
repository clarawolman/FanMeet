import { describe, it, expect, vi, beforeEach } from "vitest";

// Sin bloqueos, salvo que el test diga otra cosa.
vi.mock("../src/repositories/bloqueoRepository.js", () => ({
  bloqueoRepository: {
    idsConBloqueo: vi.fn(async () => new Set()),
    existeEntre: vi.fn(async () => false),
  },
}));

vi.mock("../src/repositories/amistadRepository.js", () => ({
  amistadRepository: {
    buscarEntreUsuarios: vi.fn(),
    obtenerPorId: vi.fn(),
    crear: vi.fn(),
    actualizarEstado: vi.fn(),
    eliminar: vi.fn(),
    listarAceptadasDeUsuario: vi.fn(),
  },
}));

vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: { listarActivosPorIds: vi.fn() },
}));

const { amistadRepository } = await import("../src/repositories/amistadRepository.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { amistadService } = await import("../src/services/amistadService.js");

const YO = "yo-uuid";
const OTRO = "otro-uuid";
const AJENO = "ajeno-uuid";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("amistadService.crearSolicitud", () => {
  it("rechaza enviarse una solicitud a uno mismo", async () => {
    await expect(amistadService.crearSolicitud(YO, YO)).rejects.toMatchObject({ status: 400 });
    expect(amistadRepository.crear).not.toHaveBeenCalled();
  });

  it("rechaza si ya existe una relación entre ambos usuarios", async () => {
    amistadRepository.buscarEntreUsuarios.mockResolvedValue({ id_amistad: 5, estado: "pendiente" });

    await expect(amistadService.crearSolicitud(YO, OTRO)).rejects.toMatchObject({ status: 400 });
    expect(amistadRepository.crear).not.toHaveBeenCalled();
  });

  it("crea la solicitud cuando no existe relación previa", async () => {
    amistadRepository.buscarEntreUsuarios.mockResolvedValue(null);
    amistadRepository.crear.mockResolvedValue({ id_amistad: 1, id_solicitante: YO, id_receptor: OTRO });

    const resultado = await amistadService.crearSolicitud(YO, OTRO);

    expect(amistadRepository.crear).toHaveBeenCalledWith(YO, OTRO);
    expect(resultado.id_solicitante).toBe(YO);
  });
});

describe("amistadService.aceptar (autorización)", () => {
  it("rechaza con 404 si la amistad no existe", async () => {
    amistadRepository.obtenerPorId.mockResolvedValue(null);
    await expect(amistadService.aceptar(YO, 1)).rejects.toMatchObject({ status: 404 });
  });

  it("rechaza con 403 si quien acepta no es el receptor de la solicitud", async () => {
    amistadRepository.obtenerPorId.mockResolvedValue({
      id_amistad: 1,
      id_solicitante: OTRO,
      id_receptor: AJENO,
    });

    await expect(amistadService.aceptar(YO, 1)).rejects.toMatchObject({ status: 403 });
    expect(amistadRepository.actualizarEstado).not.toHaveBeenCalled();
  });

  it("permite aceptar si el usuario autenticado es el receptor", async () => {
    amistadRepository.obtenerPorId.mockResolvedValue({
      id_amistad: 1,
      id_solicitante: OTRO,
      id_receptor: YO,
    });
    amistadRepository.actualizarEstado.mockResolvedValue({
      id_amistad: 1,
      estado: "aceptada",
      id_solicitante: OTRO,
      id_receptor: YO,
    });

    const resultado = await amistadService.aceptar(YO, 1);

    expect(amistadRepository.actualizarEstado).toHaveBeenCalledWith(1, "aceptada");
    expect(resultado.estado).toBe("aceptada");
  });
});

describe("amistadService.rechazarOEliminar (autorización)", () => {
  it("rechaza con 403 si el usuario autenticado no participa de la relación", async () => {
    amistadRepository.obtenerPorId.mockResolvedValue({
      id_amistad: 1,
      id_solicitante: OTRO,
      id_receptor: AJENO,
    });

    await expect(amistadService.rechazarOEliminar(YO, 1)).rejects.toMatchObject({ status: 403 });
    expect(amistadRepository.eliminar).not.toHaveBeenCalled();
  });

  it("permite eliminar si el usuario autenticado es solicitante o receptor", async () => {
    amistadRepository.obtenerPorId.mockResolvedValue({
      id_amistad: 1,
      id_solicitante: YO,
      id_receptor: OTRO,
    });

    const resultado = await amistadService.rechazarOEliminar(YO, 1);

    expect(amistadRepository.eliminar).toHaveBeenCalledWith(1);
    expect(resultado).toEqual({ ok: true });
  });
});

describe("amistadService.listarAmigos", () => {
  it("devuelve el id contrario al del usuario consultado, en la forma pública (sin mail/fechanac)", async () => {
    amistadRepository.listarAceptadasDeUsuario.mockResolvedValue([
      { id_solicitante: YO, id_receptor: OTRO },
      { id_solicitante: AJENO, id_receptor: YO },
    ]);
    usuarioRepository.listarActivosPorIds.mockResolvedValue([
      { id_usuario: OTRO, nombre: "Otro", mail: "otro@mail.com" },
      { id_usuario: AJENO, nombre: "Ajeno", mail: "ajeno@mail.com" },
    ]);

    const resultado = await amistadService.listarAmigos(YO);

    expect(usuarioRepository.listarActivosPorIds).toHaveBeenCalledWith([OTRO, AJENO]);
    expect(resultado.map((amigo) => amigo.id_usuario)).toEqual([OTRO, AJENO]);
    expect(resultado.every((amigo) => !("mail" in amigo) && !("fechanac" in amigo))).toBe(true);
  });
});

describe("amistadService con bloqueos", () => {
  it("no deja mandar una solicitud si hay un bloqueo entre los dos", async () => {
    const { bloqueoRepository } = await import("../src/repositories/bloqueoRepository.js");
    bloqueoRepository.existeEntre.mockResolvedValueOnce(true);

    await expect(amistadService.crearSolicitud(YO, OTRO)).rejects.toMatchObject({ status: 404 });
    expect(amistadRepository.crear).not.toHaveBeenCalled();
  });

  it("la lista de amigos de otro no muestra a los que tienen un bloqueo con quien mira", async () => {
    const { bloqueoRepository } = await import("../src/repositories/bloqueoRepository.js");
    amistadRepository.listarAceptadasDeUsuario.mockResolvedValue([
      { id_solicitante: AJENO, id_receptor: OTRO },
      { id_solicitante: AJENO, id_receptor: "bloqueado-uuid" },
    ]);
    usuarioRepository.listarActivosPorIds.mockResolvedValue([
      { id_usuario: OTRO, nombre: "Otro" },
      { id_usuario: "bloqueado-uuid", nombre: "Bloqueado" },
    ]);
    bloqueoRepository.idsConBloqueo.mockResolvedValueOnce(new Set(["bloqueado-uuid"]));

    const amigos = await amistadService.listarAmigos(AJENO, YO);

    expect(bloqueoRepository.idsConBloqueo).toHaveBeenCalledWith(YO);
    expect(amigos.map((a) => a.id_usuario)).toEqual([OTRO]);
  });
});
