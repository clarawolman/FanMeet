import { describe, it, expect, vi, beforeEach } from "vitest";

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
  usuarioRepository: { listarPorIds: vi.fn() },
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
  it("devuelve el id contrario al del usuario consultado, con la fila completa (igual que hoy select('*'))", async () => {
    amistadRepository.listarAceptadasDeUsuario.mockResolvedValue([
      { id_solicitante: YO, id_receptor: OTRO },
      { id_solicitante: AJENO, id_receptor: YO },
    ]);
    usuarioRepository.listarPorIds.mockResolvedValue([
      { id_usuario: OTRO, nombre: "Otro", mail: "otro@mail.com" },
      { id_usuario: AJENO, nombre: "Ajeno", mail: "ajeno@mail.com" },
    ]);

    const resultado = await amistadService.listarAmigos(YO);

    expect(usuarioRepository.listarPorIds).toHaveBeenCalledWith([OTRO, AJENO]);
    expect(resultado.map((amigo) => amigo.mail)).toEqual(["otro@mail.com", "ajeno@mail.com"]);
  });
});
