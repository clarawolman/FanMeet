import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: {
    obtenerPorId: vi.fn(),
    actualizar: vi.fn(),
  },
}));

vi.mock("../src/repositories/estiloMusicalRepository.js", () => ({
  estiloMusicalRepository: {
    listarCatalogo: vi.fn(),
    listarIdsPorUsuario: vi.fn(),
    reemplazarSeleccion: vi.fn(),
  },
}));

vi.mock("../src/repositories/highlightRepository.js", () => ({
  highlightRepository: {
    listarPorUsuario: vi.fn(),
    crear: vi.fn(),
  },
}));

vi.mock("../src/repositories/storageRepository.js", () => ({
  storageRepository: { subirArchivo: vi.fn() },
}));

vi.mock("../src/repositories/conciertoRepository.js", () => ({
  usuariosConciertosRepository: { contarPorUsuario: vi.fn() },
}));

vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoUsuarioRepository: { contarPorUsuario: vi.fn() },
}));

vi.mock("../src/repositories/amistadRepository.js", () => ({
  amistadRepository: { contarAceptadasDeUsuario: vi.fn() },
}));

const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { highlightRepository } = await import("../src/repositories/highlightRepository.js");
const { storageRepository } = await import("../src/repositories/storageRepository.js");
const { usuariosConciertosRepository } = await import("../src/repositories/conciertoRepository.js");
const { grupoUsuarioRepository } = await import("../src/repositories/grupoRepository.js");
const { amistadRepository } = await import("../src/repositories/amistadRepository.js");
const { usuarioService } = await import("../src/services/usuarioService.js");

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
    amistadRepository.contarAceptadasDeUsuario.mockResolvedValue(5);

    const resultado = await usuarioService.obtenerEstadisticas(YO);

    expect(usuariosConciertosRepository.contarPorUsuario).toHaveBeenCalledWith(YO);
    expect(grupoUsuarioRepository.contarPorUsuario).toHaveBeenCalledWith(YO);
    expect(amistadRepository.contarAceptadasDeUsuario).toHaveBeenCalledWith(YO);
    expect(resultado).toEqual({ conciertos: 3, grupos: 2, amigos: 5 });
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

describe("usuarioService.subirHighlight (límite de 4)", () => {
  it("rechaza si ya tiene 4 highlights", async () => {
    highlightRepository.listarPorUsuario.mockResolvedValue([{}, {}, {}, {}]);

    await expect(
      usuarioService.subirHighlight(YO, { originalname: "a.jpg", buffer: JPEG_VALIDO, mimetype: "image/jpeg" })
    ).rejects.toMatchObject({ status: 400 });
    expect(storageRepository.subirArchivo).not.toHaveBeenCalled();
  });

  it("permite subir si tiene menos de 4", async () => {
    highlightRepository.listarPorUsuario.mockResolvedValue([{}, {}]);
    storageRepository.subirArchivo.mockResolvedValue("https://cdn/highlights/yo-uuid/a.jpg");
    highlightRepository.crear.mockResolvedValue({ id_highlight: 1, id_usuario: YO, url_imagen: "url" });

    const resultado = await usuarioService.subirHighlight(YO, {
      originalname: "a.jpg",
      buffer: JPEG_VALIDO,
      mimetype: "image/jpeg",
    });

    expect(highlightRepository.crear).toHaveBeenCalledWith(YO, expect.any(String));
    expect(resultado.id_usuario).toBe(YO);
  });

  it("rechaza con 400 si el contenido no es una imagen real, sin llegar a chequear el límite de 4", async () => {
    await expect(
      usuarioService.subirHighlight(YO, {
        originalname: "a.jpg",
        buffer: Buffer.from("no soy una imagen"),
        mimetype: "image/jpeg",
      })
    ).rejects.toMatchObject({ status: 400 });
    expect(storageRepository.subirArchivo).not.toHaveBeenCalled();
  });
});
