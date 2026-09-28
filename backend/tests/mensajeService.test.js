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

    await expect(mensajeService.enviar(MIEMBRO, GRUPO.id_grupo, "hola")).rejects.toMatchObject({
      status: 404,
    });
    expect(mensajeRepository.crear).not.toHaveBeenCalled();
  });

  it("rechaza con 403 si el usuario no es miembro del grupo", async () => {
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);

    await expect(mensajeService.enviar(AJENO, GRUPO.id_grupo, "hola")).rejects.toMatchObject({
      status: 403,
    });
    expect(mensajeRepository.crear).not.toHaveBeenCalled();
  });

  it("crea el mensaje con el id del usuario autenticado y lo devuelve con su info", async () => {
    grupoUsuarioRepository.existeRelacion.mockResolvedValue({ id: 1 });
    mensajeRepository.crear.mockResolvedValue(FILA_MENSAJE);

    const resultado = await mensajeService.enviar(MIEMBRO, GRUPO.id_grupo, "hola");

    expect(mensajeRepository.crear).toHaveBeenCalledWith({
      idGrupo: GRUPO.id_grupo,
      idUsuario: MIEMBRO,
      contenido: "hola",
    });
    expect(resultado.usuario).toEqual(
      expect.objectContaining({ id_usuario: MIEMBRO, nombre: "Fan" })
    );
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
