import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/mensajePrivadoRepository.js", () => ({
  mensajePrivadoRepository: {
    crear: vi.fn(),
    listarConversacion: vi.fn(),
    listarRecientesDeUsuario: vi.fn(),
    listarNoLeidosDeUsuario: vi.fn(),
    marcarLeidos: vi.fn(),
  },
}));

vi.mock("../src/repositories/amistadRepository.js", () => ({
  amistadRepository: {
    buscarEntreUsuarios: vi.fn(),
    listarAceptadasDeUsuario: vi.fn(),
  },
}));

vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: { listarPorIds: vi.fn() },
}));

vi.mock("../src/repositories/notificacionRepository.js", () => ({
  notificacionRepository: {
    marcarLeidasMensajesPrivados: vi.fn(),
    listarNoLeidasMensajesGrupo: vi.fn(),
    marcarLeidasMensajesGrupo: vi.fn(),
  },
}));

vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoRepository: { listarPorIds: vi.fn() },
  grupoUsuarioRepository: {
    listarGruposPorUsuario: vi.fn(),
    listarUsuariosPorGrupos: vi.fn(),
    existeRelacion: vi.fn(),
  },
}));

vi.mock("../src/repositories/mensajeRepository.js", () => ({
  mensajeRepository: { listarRecientesDeGrupos: vi.fn() },
}));

vi.mock("../src/repositories/storageRepository.js", () => ({
  storageRepository: { subirArchivo: vi.fn() },
}));

const { mensajePrivadoRepository } = await import("../src/repositories/mensajePrivadoRepository.js");
const { amistadRepository } = await import("../src/repositories/amistadRepository.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { notificacionRepository } = await import("../src/repositories/notificacionRepository.js");
const { storageRepository } = await import("../src/repositories/storageRepository.js");
const { grupoRepository, grupoUsuarioRepository } = await import("../src/repositories/grupoRepository.js");
const { mensajeRepository } = await import("../src/repositories/mensajeRepository.js");
const { chatService } = await import("../src/services/chatService.js");

const PNG_VALIDO = {
  mimetype: "image/png",
  buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]),
};

const YO = "yo-uuid";
const AMIGO = "amigo-uuid";
const OTRO_AMIGO = "otro-amigo-uuid";
const DESCONOCIDO = "desconocido-uuid";

function mensaje(id, idEmisor, idReceptor) {
  return { id_mensaje: id, id_emisor: idEmisor, id_receptor: idReceptor, contenido: `m${id}`, leido: false };
}

function mensajeConFecha(id, idEmisor, idReceptor, fecha) {
  return { ...mensaje(id, idEmisor, idReceptor), created_at: fecha };
}

beforeEach(() => {
  vi.clearAllMocks();
  // por defecto: sin grupos y sin notificaciones de grupo
  grupoUsuarioRepository.listarGruposPorUsuario.mockResolvedValue([]);
  notificacionRepository.listarNoLeidasMensajesGrupo.mockResolvedValue([]);
});

describe("chatService.enviar", () => {
  it("rechaza con 403 si no son amigos", async () => {
    amistadRepository.buscarEntreUsuarios.mockResolvedValue(null);

    await expect(chatService.enviar(YO, DESCONOCIDO, { contenido: "hola" })).rejects.toMatchObject({ status: 403 });
    expect(mensajePrivadoRepository.crear).not.toHaveBeenCalled();
  });

  it("rechaza con 403 si la solicitud de amistad sigue pendiente", async () => {
    amistadRepository.buscarEntreUsuarios.mockResolvedValue({ estado: "pendiente" });

    await expect(chatService.enviar(YO, AMIGO, { contenido: "hola" })).rejects.toMatchObject({ status: 403 });
    expect(mensajePrivadoRepository.crear).not.toHaveBeenCalled();
  });

  it("rechaza con 400 si se intenta chatear con uno mismo", async () => {
    await expect(chatService.enviar(YO, YO, { contenido: "hola" })).rejects.toMatchObject({ status: 400 });
  });

  it("crea el mensaje con el usuario autenticado como emisor si son amigos", async () => {
    amistadRepository.buscarEntreUsuarios.mockResolvedValue({ estado: "aceptada" });
    mensajePrivadoRepository.crear.mockResolvedValue(mensaje(1, YO, AMIGO));

    const resultado = await chatService.enviar(YO, AMIGO, { contenido: "hola" });

    expect(mensajePrivadoRepository.crear).toHaveBeenCalledWith({
      idEmisor: YO,
      idReceptor: AMIGO,
      contenido: "hola",
      imagen: null,
    });
    expect(resultado).toMatchObject({ id_mensaje: 1, id_emisor: YO, id_receptor: AMIGO });
  });

  it("rechaza con 400 un mensaje sin texto ni foto", async () => {
    await expect(chatService.enviar(YO, AMIGO, { contenido: "   " })).rejects.toMatchObject({ status: 400 });
    expect(mensajePrivadoRepository.crear).not.toHaveBeenCalled();
  });

  it("rechaza con 400 un archivo que no es una imagen real", async () => {
    const archivoFalso = { mimetype: "image/png", buffer: Buffer.from("<svg onload=alert(1)>") };

    await expect(
      chatService.enviar(YO, AMIGO, { archivo: archivoFalso })
    ).rejects.toMatchObject({ status: 400 });
    expect(storageRepository.subirArchivo).not.toHaveBeenCalled();
  });

  it("no sube la foto si no son amigos", async () => {
    amistadRepository.buscarEntreUsuarios.mockResolvedValue(null);

    await expect(
      chatService.enviar(YO, DESCONOCIDO, { archivo: PNG_VALIDO })
    ).rejects.toMatchObject({ status: 403 });
    expect(storageRepository.subirArchivo).not.toHaveBeenCalled();
  });

  it("sube la foto al bucket chats con nombre aleatorio y la guarda en el mensaje", async () => {
    amistadRepository.buscarEntreUsuarios.mockResolvedValue({ estado: "aceptada" });
    storageRepository.subirArchivo.mockResolvedValue("https://cdn/foto.png");
    mensajePrivadoRepository.crear.mockResolvedValue({ ...mensaje(1, YO, AMIGO), imagen: "https://cdn/foto.png" });

    const resultado = await chatService.enviar(YO, AMIGO, { contenido: "", archivo: PNG_VALIDO });

    const [bucket, ruta] = storageRepository.subirArchivo.mock.calls[0];
    expect(bucket).toBe("chats");
    expect(ruta).toMatch(new RegExp(`^${YO}/[0-9a-f-]{36}\.png$`));
    expect(mensajePrivadoRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ contenido: "", imagen: "https://cdn/foto.png" })
    );
    expect(resultado.imagen).toBe("https://cdn/foto.png");
  });
});

describe("chatService.listarMensajes", () => {
  it("rechaza con 403 si no son amigos", async () => {
    amistadRepository.buscarEntreUsuarios.mockResolvedValue(null);

    await expect(chatService.listarMensajes(YO, DESCONOCIDO)).rejects.toMatchObject({ status: 403 });
    expect(mensajePrivadoRepository.listarConversacion).not.toHaveBeenCalled();
  });

  it("devuelve la conversación y marca como leídos los mensajes recibidos", async () => {
    amistadRepository.buscarEntreUsuarios.mockResolvedValue({ estado: "aceptada" });
    mensajePrivadoRepository.listarConversacion.mockResolvedValue([mensaje(1, AMIGO, YO)]);

    const resultado = await chatService.listarMensajes(YO, AMIGO);

    expect(resultado).toHaveLength(1);
    expect(mensajePrivadoRepository.marcarLeidos).toHaveBeenCalledWith(YO, AMIGO);
    expect(notificacionRepository.marcarLeidasMensajesPrivados).toHaveBeenCalledWith(YO, AMIGO);
  });

  it("al cargar mensajes viejos (paginación) no vuelve a marcar como leído", async () => {
    amistadRepository.buscarEntreUsuarios.mockResolvedValue({ estado: "aceptada" });
    mensajePrivadoRepository.listarConversacion.mockResolvedValue([]);

    await chatService.listarMensajes(YO, AMIGO, { antesDeId: 40 });

    expect(mensajePrivadoRepository.listarConversacion).toHaveBeenCalledWith(YO, AMIGO, { antesDeId: 40 });
    expect(mensajePrivadoRepository.marcarLeidos).not.toHaveBeenCalled();
  });
});

describe("chatService.listarChats", () => {
  it("incluye un chat por cada grupo del que es miembro, mezclado por fecha con los privados", async () => {
    amistadRepository.listarAceptadasDeUsuario.mockResolvedValue([{ id_solicitante: YO, id_receptor: AMIGO }]);
    usuarioRepository.listarPorIds.mockImplementation(async (ids) =>
      ids.map((id) => ({ id_usuario: id, nombre: id === AMIGO ? "Ana" : "Yo" }))
    );
    mensajePrivadoRepository.listarRecientesDeUsuario.mockResolvedValue([
      mensajeConFecha(1, AMIGO, YO, "2026-10-05T10:00:00Z"),
    ]);
    mensajePrivadoRepository.listarNoLeidosDeUsuario.mockResolvedValue([]);

    grupoUsuarioRepository.listarGruposPorUsuario.mockResolvedValue([{ id_grupo: 7 }, { id_grupo: 8 }]);
    grupoRepository.listarPorIds.mockResolvedValue([
      { id_grupo: 7, nombre: "Casa dorin" },
      { id_grupo: 8, nombre: "Grupo nuevo" },
    ]);
    grupoUsuarioRepository.listarUsuariosPorGrupos.mockResolvedValue([
      { id_grupo: 7, id_usuario: YO },
      { id_grupo: 7, id_usuario: AMIGO },
      { id_grupo: 8, id_usuario: YO },
    ]);
    mensajeRepository.listarRecientesDeGrupos.mockResolvedValue([
      { id_mensaje: 30, id_grupo: 7, id_usuario: AMIGO, contenido: "a las 12", created_at: "2026-10-05T12:00:00Z" },
      { id_mensaje: 20, id_grupo: 7, id_usuario: YO, contenido: "hola", created_at: "2026-10-05T09:00:00Z" },
    ]);
    notificacionRepository.listarNoLeidasMensajesGrupo.mockResolvedValue([{ id_grupo: 7 }]);

    const chats = await chatService.listarChats(YO);

    // grupo 7 (12:00) > Ana (10:00) > grupo 8 (sin mensajes, recién creado)
    expect(chats.map((c) => c.tipo)).toEqual(["grupo", "privado", "grupo"]);
    expect(chats[0]).toMatchObject({
      grupo: { id_grupo: 7, nombre: "Casa dorin" },
      ultimoMensaje: { id_mensaje: 30, contenido: "a las 12", usuario: { nombre: "Ana" } },
      noLeidos: 1,
    });
    expect(chats[0].grupo.usuarios).toHaveLength(2);
    expect(chats[2]).toMatchObject({ grupo: { id_grupo: 8 }, ultimoMensaje: null, noLeidos: 0 });
  });

  it("devuelve [] si no tiene amigos", async () => {
    amistadRepository.listarAceptadasDeUsuario.mockResolvedValue([]);

    expect(await chatService.listarChats(YO)).toEqual([]);
  });

  it("arma un chat por amigo con su último mensaje y no leídos, el más reciente primero", async () => {
    amistadRepository.listarAceptadasDeUsuario.mockResolvedValue([
      { id_solicitante: YO, id_receptor: AMIGO },
      { id_solicitante: OTRO_AMIGO, id_receptor: YO },
    ]);
    usuarioRepository.listarPorIds.mockResolvedValue([
      { id_usuario: AMIGO, nombre: "Ana" },
      { id_usuario: OTRO_AMIGO, nombre: "Beto" },
    ]);
    // del más nuevo al más viejo, como lo devuelve el repository
    mensajePrivadoRepository.listarRecientesDeUsuario.mockResolvedValue([
      mensajeConFecha(5, OTRO_AMIGO, YO, "2026-10-05T12:00:00Z"),
      mensajeConFecha(4, OTRO_AMIGO, YO, "2026-10-05T11:00:00Z"),
      mensajeConFecha(2, YO, AMIGO, "2026-10-04T10:00:00Z"),
    ]);
    mensajePrivadoRepository.listarNoLeidosDeUsuario.mockResolvedValue([
      { id_emisor: OTRO_AMIGO },
      { id_emisor: OTRO_AMIGO },
    ]);

    const chats = await chatService.listarChats(YO);

    expect(chats.map((c) => c.usuario.id_usuario)).toEqual([OTRO_AMIGO, AMIGO]);
    expect(chats[0]).toMatchObject({ tipo: "privado", noLeidos: 2, ultimoMensaje: { id_mensaje: 5 } });
    expect(chats[1]).toMatchObject({ noLeidos: 0, ultimoMensaje: { id_mensaje: 2 } });
  });

  it("incluye a los amigos sin mensajes al final, ordenados por nombre", async () => {
    amistadRepository.listarAceptadasDeUsuario.mockResolvedValue([
      { id_solicitante: YO, id_receptor: AMIGO },
      { id_solicitante: YO, id_receptor: OTRO_AMIGO },
    ]);
    usuarioRepository.listarPorIds.mockResolvedValue([
      { id_usuario: OTRO_AMIGO, nombre: "Zoe" },
      { id_usuario: AMIGO, nombre: "Ana" },
    ]);
    mensajePrivadoRepository.listarRecientesDeUsuario.mockResolvedValue([]);
    mensajePrivadoRepository.listarNoLeidosDeUsuario.mockResolvedValue([]);

    const chats = await chatService.listarChats(YO);

    expect(chats.map((c) => c.usuario.nombre)).toEqual(["Ana", "Zoe"]);
    expect(chats[0].ultimoMensaje).toBeNull();
  });
});

describe("chatService.marcarGrupoLeido", () => {
  it("rechaza con 403 si no es miembro del grupo", async () => {
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);

    await expect(chatService.marcarGrupoLeido(YO, 7)).rejects.toMatchObject({ status: 403 });
    expect(notificacionRepository.marcarLeidasMensajesGrupo).not.toHaveBeenCalled();
  });

  it("marca como leídas las notificaciones de mensajes de ese grupo", async () => {
    grupoUsuarioRepository.existeRelacion.mockResolvedValue({ id_grupo: 7 });

    await chatService.marcarGrupoLeido(YO, 7);

    expect(notificacionRepository.marcarLeidasMensajesGrupo).toHaveBeenCalledWith(YO, 7);
  });
});

describe("chatService.contarNoLeidos", () => {
  it("suma los mensajes privados y los de grupo sin leer", async () => {
    mensajePrivadoRepository.listarNoLeidosDeUsuario.mockResolvedValue([{ id_emisor: AMIGO }]);
    notificacionRepository.listarNoLeidasMensajesGrupo.mockResolvedValue([{ id_grupo: 7 }, { id_grupo: 7 }]);

    expect(await chatService.contarNoLeidos(YO)).toEqual({ total: 3 });
  });
});
