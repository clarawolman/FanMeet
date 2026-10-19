import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/mensajeRepository.js", () => ({
  mensajeRepository: {
    crear: vi.fn(),
    listarPorGrupo: vi.fn(),
  },
}));

vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoRepository: {
    obtenerPorId: vi.fn(),
  },
  grupoUsuarioRepository: {
    existeRelacion: vi.fn(),
  },
}));

vi.mock("../src/repositories/storageRepository.js", () => ({
  storageRepository: { subirArchivo: vi.fn() },
}));

vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: {
    obtenerPorId: vi.fn(),
    listarPorIds: vi.fn(),
  },
}));

const { mensajeRepository } = await import("../src/repositories/mensajeRepository.js");
const { grupoRepository, grupoUsuarioRepository } = await import(
  "../src/repositories/grupoRepository.js"
);
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { storageRepository } = await import("../src/repositories/storageRepository.js");
const { mensajeService } = await import("../src/services/mensajeService.js");

const MIEMBRO = "miembro-uuid";
const AJENO = "ajeno-uuid";
const GRUPO = { id_grupo: 1, id_creador: MIEMBRO, id_concierto: 10 };
const FILA_MENSAJE = {
  id_mensaje: 1,
  id_grupo: GRUPO.id_grupo,
  id_usuario: MIEMBRO,
  contenido: "hola",
  created_at: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  grupoRepository.obtenerPorId.mockResolvedValue(GRUPO);
  usuarioRepository.obtenerPorId.mockResolvedValue({ id_usuario: MIEMBRO, nombre: "Fan" });
  usuarioRepository.listarPorIds.mockResolvedValue([{ id_usuario: MIEMBRO, nombre: "Fan" }]);
});

describe("mensajeService.enviar", () => {
  it("rechaza con 404 si el grupo no existe", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue(null);

    await expect(mensajeService.enviar(MIEMBRO, GRUPO.id_grupo, { contenido: "hola" })).rejects.toMatchObject({
      status: 404,
    });
    expect(mensajeRepository.crear).not.toHaveBeenCalled();
  });

  it("rechaza con 403 si el usuario no es miembro del grupo", async () => {
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);

    await expect(mensajeService.enviar(AJENO, GRUPO.id_grupo, { contenido: "hola" })).rejects.toMatchObject({
      status: 403,
    });
    expect(mensajeRepository.crear).not.toHaveBeenCalled();
  });

  it("crea el mensaje con el id del usuario autenticado y lo devuelve con su info", async () => {
    grupoUsuarioRepository.existeRelacion.mockResolvedValue({ id: 1 });
    mensajeRepository.crear.mockResolvedValue(FILA_MENSAJE);

    const resultado = await mensajeService.enviar(MIEMBRO, GRUPO.id_grupo, { contenido: " hola " });

    expect(mensajeRepository.crear).toHaveBeenCalledWith({
      idGrupo: GRUPO.id_grupo,
      idUsuario: MIEMBRO,
      contenido: "hola",
      imagen: null,
    });
    expect(resultado.usuario).toEqual(
      expect.objectContaining({ id_usuario: MIEMBRO, nombre: "Fan" })
    );
  });
});

describe("mensajeService.enviar con fotos", () => {
  const PNG = {
    mimetype: "image/png",
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]),
  };

  it("rechaza un mensaje sin texto ni foto", async () => {
    await expect(mensajeService.enviar(MIEMBRO, GRUPO.id_grupo, { contenido: "  " })).rejects.toMatchObject({
      status: 400,
    });
    expect(mensajeRepository.crear).not.toHaveBeenCalled();
  });

  it("rechaza un archivo que dice ser png pero no lo es", async () => {
    const falso = { mimetype: "image/png", buffer: Buffer.from("<svg onload=alert(1)>") };
    await expect(
      mensajeService.enviar(MIEMBRO, GRUPO.id_grupo, { archivo: falso })
    ).rejects.toMatchObject({ status: 400 });
    expect(storageRepository.subirArchivo).not.toHaveBeenCalled();
  });

  it("si no es integrante, no sube la foto", async () => {
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);
    await expect(
      mensajeService.enviar(AJENO, GRUPO.id_grupo, { archivo: PNG })
    ).rejects.toMatchObject({ status: 403 });
    expect(storageRepository.subirArchivo).not.toHaveBeenCalled();
  });

  it("sube la foto en la carpeta del grupo y guarda su URL", async () => {
    grupoUsuarioRepository.existeRelacion.mockResolvedValue({ id: 1 });
    storageRepository.subirArchivo.mockResolvedValue("https://cdn/foto.png");
    mensajeRepository.crear.mockResolvedValue({ ...FILA_MENSAJE, contenido: "", imagen: "https://cdn/foto.png" });

    const resultado = await mensajeService.enviar(MIEMBRO, GRUPO.id_grupo, { archivo: PNG });

    const [bucket, ruta] = storageRepository.subirArchivo.mock.calls[0];
    expect(bucket).toBe("chats");
    expect(ruta).toMatch(/^grupos\/1\/[0-9a-f-]+\.png$/);
    expect(mensajeRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ contenido: "", imagen: "https://cdn/foto.png" })
    );
    expect(resultado.imagen).toBe("https://cdn/foto.png");
  });
});

describe("mensajeService.listar", () => {
  it("rechaza con 403 si el usuario no es miembro del grupo", async () => {
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);

    await expect(mensajeService.listar(AJENO, GRUPO.id_grupo)).rejects.toMatchObject({
      status: 403,
    });
    expect(mensajeRepository.listarPorGrupo).not.toHaveBeenCalled();
  });

  it("devuelve los mensajes del grupo con la info de cada emisor", async () => {
    grupoUsuarioRepository.existeRelacion.mockResolvedValue({ id: 1 });
    mensajeRepository.listarPorGrupo.mockResolvedValue([FILA_MENSAJE]);

    const resultado = await mensajeService.listar(MIEMBRO, GRUPO.id_grupo, { limite: 20 });

    expect(mensajeRepository.listarPorGrupo).toHaveBeenCalledWith(GRUPO.id_grupo, { limite: 20 });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].usuario.nombre).toBe("Fan");
  });
});
