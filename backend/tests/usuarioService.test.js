import { describe, it, expect, vi, beforeEach } from "vitest";

// Sin bloqueos, salvo que el test diga otra cosa.
vi.mock("../src/repositories/bloqueoRepository.js", () => ({
  bloqueoRepository: {
    idsConBloqueo: vi.fn(async () => new Set()),
    existeEntre: vi.fn(async () => false),
  },
}));

vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: {
    obtenerPorId: vi.fn(),
    actualizar: vi.fn(),
    listarActivosPorIds: vi.fn(),
    existeNombreSinMayusculas: vi.fn(),
  },
}));

vi.mock("../src/repositories/estiloMusicalRepository.js", () => ({
  estiloMusicalRepository: {
    listarCatalogo: vi.fn(),
    listarIdsPorUsuario: vi.fn(),
    reemplazarSeleccion: vi.fn(),
  },
}));

vi.mock("../src/repositories/storageRepository.js", () => ({
  storageRepository: { subirArchivo: vi.fn(), eliminarPorUrl: vi.fn() },
}));


vi.mock("../src/repositories/conciertoRepository.js", () => ({
  usuariosConciertosRepository: { contarPorUsuario: vi.fn() },
}));

vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoUsuarioRepository: { contarPorUsuario: vi.fn() },
}));

vi.mock("../src/repositories/amistadRepository.js", () => ({
  amistadRepository: { listarAceptadasDeUsuario: vi.fn() },
}));

const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { storageRepository } = await import("../src/repositories/storageRepository.js");
const { usuariosConciertosRepository } = await import("../src/repositories/conciertoRepository.js");
const { grupoUsuarioRepository } = await import("../src/repositories/grupoRepository.js");
const { amistadRepository } = await import("../src/repositories/amistadRepository.js");
const { usuarioService, proximoCambioDeNombre } = await import("../src/services/usuarioService.js");

const YO = "yo-uuid";
const JPEG_VALIDO = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usuarioService.obtenerPerfil", () => {
  it("rechaza con 404 si el usuario no existe", async () => {
    usuarioRepository.obtenerPorId.mockResolvedValue(null);
    await expect(usuarioService.obtenerPerfil("no-existe")).rejects.toMatchObject({ status: 404 });
  });

  it("incluye mail y fechanac (uso exclusivo del propio usuario)", async () => {
    usuarioRepository.obtenerPorId.mockResolvedValue({
      id_usuario: YO,
      nombre: "Ana",
      mail: "ana@mail.com",
      fechanac: "2000-01-01",
    });

    const resultado = await usuarioService.obtenerPerfil(YO);

    expect(resultado.mail).toBe("ana@mail.com");
    expect(resultado.fechanac).toBe("2000-01-01");
  });
});

describe("usuarioService.obtenerPerfilPublico", () => {
  it("nunca incluye mail ni fechanac, aunque la fila los tenga", async () => {
    usuarioRepository.obtenerPorId.mockResolvedValue({
      id_usuario: "otro-uuid",
      nombre: "Otro",
      mail: "otro@mail.com",
      fechanac: "1999-05-05",
      fotoperfil: "https://cdn/foto.jpg",
    });

    const resultado = await usuarioService.obtenerPerfilPublico("otro-uuid");

    expect(resultado).not.toHaveProperty("mail");
    expect(resultado).not.toHaveProperty("fechanac");
    expect(resultado.nombre).toBe("Otro");
  });

  it("rechaza con 404 si el usuario no existe", async () => {
    usuarioRepository.obtenerPorId.mockResolvedValue(null);
    await expect(usuarioService.obtenerPerfilPublico("no-existe")).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("usuarioService.obtenerGenerosUsuario / guardarGeneros", () => {
  it("lee los géneros de CUALQUIER id pasado, no de un usuario fijo", async () => {
    const { estiloMusicalRepository } = await import("../src/repositories/estiloMusicalRepository.js");
    estiloMusicalRepository.listarIdsPorUsuario.mockResolvedValue([{ id_estilo: 1 }, { id_estilo: 3 }]);

    const resultado = await usuarioService.obtenerGenerosUsuario("cualquier-id");

    expect(estiloMusicalRepository.listarIdsPorUsuario).toHaveBeenCalledWith("cualquier-id");
    expect(resultado).toEqual([1, 3]);
  });

  it("guardarGeneros reemplaza la selección y devuelve los ids ya guardados", async () => {
    const { estiloMusicalRepository } = await import("../src/repositories/estiloMusicalRepository.js");
    estiloMusicalRepository.listarIdsPorUsuario.mockResolvedValue([{ id_estilo: 2 }, { id_estilo: 4 }]);

    const resultado = await usuarioService.guardarGeneros(YO, [2, 4]);

    expect(estiloMusicalRepository.reemplazarSeleccion).toHaveBeenCalledWith(YO, [2, 4]);
    expect(resultado).toEqual([2, 4]);
  });
});

describe("usuarioService.obtenerEstadisticas", () => {
  it("combina los 3 contadores (conciertos, grupos, amigos)", async () => {
    usuariosConciertosRepository.contarPorUsuario.mockResolvedValue(3);
    grupoUsuarioRepository.contarPorUsuario.mockResolvedValue(2);
    amistadRepository.listarAceptadasDeUsuario.mockResolvedValue([
      { id_solicitante: YO, id_receptor: "a1" },
      { id_solicitante: "a2", id_receptor: YO },
      { id_solicitante: YO, id_receptor: "suspendido" },
    ]);
    // listarActivosPorIds ya descarta al suspendido.
    usuarioRepository.listarActivosPorIds.mockResolvedValue([{ id_usuario: "a1" }, { id_usuario: "a2" }]);

    const resultado = await usuarioService.obtenerEstadisticas(YO);

    expect(usuariosConciertosRepository.contarPorUsuario).toHaveBeenCalledWith(YO);
    expect(grupoUsuarioRepository.contarPorUsuario).toHaveBeenCalledWith(YO);
    expect(usuarioRepository.listarActivosPorIds).toHaveBeenCalledWith(["a1", "a2", "suspendido"]);
    expect(resultado).toEqual({ conciertos: 3, grupos: 2, amigos: 2 });
  });
});

describe("usuarioService.actualizarFoto / actualizarVibra (identidad)", () => {
  it("sube la foto y actualiza siempre con el id del usuario autenticado, nunca uno externo", async () => {
    storageRepository.subirArchivo.mockResolvedValue("https://cdn/avatars/yo-uuid/foto.jpg");
    usuarioRepository.actualizar.mockResolvedValue({ id_usuario: YO, fotoperfil: "url" });

    await usuarioService.actualizarFoto(YO, { originalname: "foto.jpg", buffer: JPEG_VALIDO, mimetype: "image/jpeg" });

    expect(usuarioRepository.actualizar).toHaveBeenCalledWith(YO, { fotoperfil: expect.any(String) });
  });

  it("rechaza con 400 si el contenido del archivo no coincide con una imagen real (mimetype falseado)", async () => {
    await expect(
      usuarioService.actualizarFoto(YO, {
        originalname: "foto.jpg",
        buffer: Buffer.from("<svg onload=alert(1)>"),
        mimetype: "image/jpeg",
      })
    ).rejects.toMatchObject({ status: 400 });
    expect(storageRepository.subirArchivo).not.toHaveBeenCalled();
  });

  it("actualiza estilo_asistencia solo del usuario autenticado", async () => {
    usuarioRepository.actualizar.mockResolvedValue({ id_usuario: YO, estilo_asistencia: "pogo" });

    await usuarioService.actualizarVibra(YO, "pogo");

    expect(usuarioRepository.actualizar).toHaveBeenCalledWith(YO, { estilo_asistencia: "pogo" });
  });
});

describe("usuarioService.actualizarPerfil", () => {
  it("guarda apodo y descripción (vacío = sin dato)", async () => {
    usuarioRepository.obtenerPorId.mockResolvedValue({ id_usuario: YO, nombre: "ana" });
    usuarioRepository.actualizar.mockResolvedValue({ id_usuario: YO, nombre: "ana" });

    await usuarioService.actualizarPerfil(YO, { apodo: "Ani", descripcion: "" });

    expect(usuarioRepository.actualizar).toHaveBeenCalledWith(YO, { apodo: "Ani", descripcion: null });
  });

  it("cambia el @nombre y guarda cuándo", async () => {
    usuarioRepository.obtenerPorId.mockResolvedValue({ id_usuario: YO, nombre: "ana", nombre_cambiado_at: null });
    usuarioRepository.existeNombreSinMayusculas.mockResolvedValue(false);
    usuarioRepository.actualizar.mockResolvedValue({ id_usuario: YO, nombre: "ana.rock" });

    await usuarioService.actualizarPerfil(YO, { nombre: "ana.rock" });

    expect(usuarioRepository.actualizar).toHaveBeenCalledWith(YO, {
      nombre: "ana.rock",
      nombre_cambiado_at: expect.any(String),
    });
  });

  it("no deja cambiar el @nombre otra vez antes de 15 días", async () => {
    const hace3Dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    usuarioRepository.obtenerPorId.mockResolvedValue({ id_usuario: YO, nombre: "ana", nombre_cambiado_at: hace3Dias });

    await expect(usuarioService.actualizarPerfil(YO, { nombre: "ana.rock" })).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("12 días"),
    });
    expect(usuarioRepository.actualizar).not.toHaveBeenCalled();
  });

  it("no deja usar un @nombre de otra persona", async () => {
    usuarioRepository.obtenerPorId.mockResolvedValue({ id_usuario: YO, nombre: "ana" });
    usuarioRepository.existeNombreSinMayusculas.mockResolvedValue(true);

    await expect(usuarioService.actualizarPerfil(YO, { nombre: "Juan" })).rejects.toMatchObject({ status: 400 });
  });

  it("mandar el mismo @nombre no cuenta como cambio", async () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    usuarioRepository.obtenerPorId.mockResolvedValue({ id_usuario: YO, nombre: "ana", nombre_cambiado_at: ayer });
    usuarioRepository.actualizar.mockResolvedValue({ id_usuario: YO, nombre: "ana" });

    await usuarioService.actualizarPerfil(YO, { nombre: "ana", apodo: "Ani" });

    expect(usuarioRepository.actualizar).toHaveBeenCalledWith(YO, { apodo: "Ani" });
  });
});

describe("proximoCambioDeNombre", () => {
  const ahora = new Date("2026-10-19T12:00:00Z");

  it("null si nunca lo cambió o ya pasaron 15 días", () => {
    expect(proximoCambioDeNombre(null, ahora)).toBeNull();
    expect(proximoCambioDeNombre("2026-10-04T12:00:00Z", ahora)).toBeNull();
  });

  it("la fecha desde la que puede volver a cambiarlo", () => {
    expect(proximoCambioDeNombre("2026-10-10T12:00:00Z", ahora)).toEqual(new Date("2026-10-25T12:00:00Z"));
  });
});
