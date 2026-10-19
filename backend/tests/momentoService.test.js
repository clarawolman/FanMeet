import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/highlightRepository.js", () => ({
  highlightRepository: {
    listarPorUsuario: vi.fn(),
    listarGuardados: vi.fn(),
    obtenerDetalle: vi.fn(),
    obtenerPorId: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
    agregarFotos: vi.fn(),
    listarFotos: vi.fn(),
    agregarParticipantes: vi.fn(),
    obtenerParticipacion: vi.fn(),
    aceptarParticipacion: vi.fn(),
    quitarParticipacion: vi.fn(),
    contarParticipantes: vi.fn(),
    fijar: vi.fn(),
    contarFijados: vi.fn(),
    listarLikes: vi.fn(),
    darLike: vi.fn(),
    quitarLike: vi.fn(),
    listarComentarios: vi.fn(),
    obtenerComentario: vi.fn(),
    crearComentario: vi.fn(),
    eliminarComentario: vi.fn(),
    darLikeComentario: vi.fn(),
    quitarLikeComentario: vi.fn(),
    estaGuardado: vi.fn(),
    guardar: vi.fn(),
    quitarGuardado: vi.fn(),
  },
}));

vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: { obtenerPorId: vi.fn(), listarActivosPorIds: vi.fn() },
}));

vi.mock("../src/repositories/amistadRepository.js", () => ({
  amistadRepository: { listarAceptadasDeUsuario: vi.fn() },
}));

vi.mock("../src/repositories/storageRepository.js", () => ({
  storageRepository: { subirArchivo: vi.fn(), eliminarPorUrl: vi.fn() },
}));

vi.mock("../src/repositories/notificacionRepository.js", () => ({
  notificacionRepository: { eliminarInvitacionMomento: vi.fn(), eliminarDeMomento: vi.fn() },
}));

vi.mock("../src/repositories/conciertoRepository.js", () => ({
  conciertoRepository: { obtenerPorId: vi.fn() },
  usuariosConciertosRepository: { existeRelacion: vi.fn() },
}));

vi.mock("../src/services/notificacionService.js", () => ({
  notificacionService: { crear: vi.fn() },
}));

const { highlightRepository } = await import("../src/repositories/highlightRepository.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { amistadRepository } = await import("../src/repositories/amistadRepository.js");
const { storageRepository } = await import("../src/repositories/storageRepository.js");
const { notificacionRepository } = await import("../src/repositories/notificacionRepository.js");
const { usuariosConciertosRepository } = await import("../src/repositories/conciertoRepository.js");
const { notificacionService } = await import("../src/services/notificacionService.js");
const { momentoService } = await import("../src/services/momentoService.js");

const YO = "yo-uuid";
const AMIGO = "amigo-uuid";
const DESCONOCIDO = "desconocido-uuid";
const JPEG_VALIDO = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const FOTO = { originalname: "a.jpg", buffer: JPEG_VALIDO, mimetype: "image/jpeg" };

// Momento 7 subido por YO y aceptado también por AMIGO
function momento(cambios = {}) {
  return {
    id_highlight: 7,
    id_usuario: YO,
    url_imagen: "https://cdn/portada.jpg",
    comentarios_activados: true,
    ocultar_likes: false,
    highlight_foto: [
      { url_imagen: "https://cdn/2.jpg", orden: 1 },
      { url_imagen: "https://cdn/portada.jpg", orden: 0 },
    ],
    highlight_usuario: [
      { id_usuario: YO, estado: "aceptado", fijado_at: null },
      { id_usuario: AMIGO, estado: "aceptado", fijado_at: null },
    ],
    ...cambios,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  usuarioRepository.listarActivosPorIds.mockImplementation(async (ids) =>
    ids.map((id) => ({ id_usuario: id, nombre: id }))
  );
  usuarioRepository.obtenerPorId.mockImplementation(async (id) => ({ id_usuario: id, nombre: id, apodo: null }));
  highlightRepository.obtenerDetalle.mockResolvedValue(momento());
  highlightRepository.listarLikes.mockResolvedValue([]);
  highlightRepository.listarComentarios.mockResolvedValue([]);
  highlightRepository.estaGuardado.mockResolvedValue(false);
});

describe("momentoService.subir", () => {
  beforeEach(() => {
    storageRepository.subirArchivo.mockImplementation(async (_b, ruta) => `https://cdn/${ruta}`);
    highlightRepository.crear.mockResolvedValue({ id_highlight: 7 });
    amistadRepository.listarAceptadasDeUsuario.mockResolvedValue([
      { id_solicitante: YO, id_receptor: AMIGO, estado: "aceptada" },
    ]);
  });

  it("sube varias fotos en orden, la primera es la portada", async () => {
    await momentoService.subir(YO, [FOTO, FOTO, FOTO], { descripcion: "Qué noche" });

    expect(storageRepository.subirArchivo).toHaveBeenCalledTimes(3);
    const urls = highlightRepository.agregarFotos.mock.calls[0][1];
    expect(urls).toHaveLength(3);
    expect(highlightRepository.crear).toHaveBeenCalledWith(
      expect.objectContaining({ url_imagen: urls[0], descripcion: "Qué noche", comentarios_activados: true })
    );
  });

  it("rechaza más de 10 fotos o ninguna", async () => {
    await expect(momentoService.subir(YO, Array(11).fill(FOTO))).rejects.toMatchObject({ status: 400 });
    await expect(momentoService.subir(YO, [])).rejects.toMatchObject({ status: 400 });
    expect(storageRepository.subirArchivo).not.toHaveBeenCalled();
  });

  it("quien sube queda aceptado y cada etiquetado pendiente, con notificación", async () => {
    await momentoService.subir(YO, [FOTO], { etiquetados: [AMIGO] });

    expect(highlightRepository.agregarParticipantes).toHaveBeenCalledWith(7, [
      { id_usuario: YO, estado: "aceptado" },
      { id_usuario: AMIGO, estado: "pendiente" },
    ]);
    expect(notificacionService.crear).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario: AMIGO, tipo: "momento_etiquetado", idHighlight: 7 })
    );
  });

  it("no deja etiquetar a quien no es amigo", async () => {
    await expect(momentoService.subir(YO, [FOTO], { etiquetados: [DESCONOCIDO] })).rejects.toMatchObject({
      status: 400,
    });
    expect(storageRepository.subirArchivo).not.toHaveBeenCalled();
  });

  it("solo deja elegir un concierto al que se unió", async () => {
    usuariosConciertosRepository.existeRelacion.mockResolvedValue(null);
    await expect(momentoService.subir(YO, [FOTO], { idConcierto: 3 })).rejects.toMatchObject({ status: 400 });
  });

  it("no hay límite de momentos por perfil", async () => {
    await momentoService.subir(YO, [FOTO]);
    expect(highlightRepository.crear).toHaveBeenCalled();
  });
});

describe("momentoService.obtener", () => {
  it("arma las fotos en orden y el autor primero", async () => {
    highlightRepository.obtenerDetalle.mockResolvedValue(
      momento({
        highlight_usuario: [
          { id_usuario: AMIGO, estado: "aceptado" },
          { id_usuario: YO, estado: "aceptado" },
        ],
      })
    );

    const detalle = await momentoService.obtener(DESCONOCIDO, "7");

    expect(detalle.fotos).toEqual(["https://cdn/portada.jpg", "https://cdn/2.jpg"]);
    expect(detalle.participantes.map((p) => p.id_usuario)).toEqual([YO, AMIGO]);
    expect(detalle.soyParticipante).toBe(false);
  });

  it("con los me gusta ocultos, solo los participantes ven la cantidad", async () => {
    highlightRepository.obtenerDetalle.mockResolvedValue(momento({ ocultar_likes: true }));
    highlightRepository.listarLikes.mockResolvedValue([{ id_usuario: DESCONOCIDO }]);

    expect((await momentoService.obtener(DESCONOCIDO, "7")).cantidadLikes).toBeNull();
    expect((await momentoService.obtener(YO, "7")).cantidadLikes).toBe(1);
  });

  it("pone las respuestas debajo de su comentario", async () => {
    highlightRepository.listarComentarios.mockResolvedValue([
      { id_comentario: 1, id_usuario: AMIGO, texto: "Épico", id_respuesta_a: null },
      { id_comentario: 2, id_usuario: YO, texto: "Siii", id_respuesta_a: 1, highlight_comentario_like: [{ id_usuario: AMIGO }] },
    ]);

    const { comentarios } = await momentoService.obtener(AMIGO, "7");

    expect(comentarios).toHaveLength(1);
    expect(comentarios[0].respuestas[0]).toMatchObject({ texto: "Siii", cantidadLikes: 1, yoDiLike: true });
  });

  it("404 si ya nadie lo tiene en su perfil", async () => {
    highlightRepository.obtenerDetalle.mockResolvedValue(momento({ highlight_usuario: [] }));
    await expect(momentoService.obtener(YO, "7")).rejects.toMatchObject({ status: 404 });
  });
});

describe("momentoService me gusta", () => {
  it("avisa a los participantes menos a quien dio me gusta", async () => {
    await momentoService.darLike(AMIGO, "7");

    expect(highlightRepository.darLike).toHaveBeenCalledWith("7", AMIGO);
    expect(notificacionService.crear).toHaveBeenCalledTimes(1);
    expect(notificacionService.crear).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario: YO, tipo: "momento_like" })
    );
  });

  it("dar me gusta dos veces no avisa dos veces", async () => {
    highlightRepository.listarLikes.mockResolvedValue([{ id_usuario: AMIGO }]);
    await momentoService.darLike(AMIGO, "7");
    expect(notificacionService.crear).not.toHaveBeenCalled();
  });

  it("al sacarlo se borra el aviso", async () => {
    await momentoService.quitarLike(AMIGO, "7");
    expect(notificacionRepository.eliminarDeMomento).toHaveBeenCalledWith({
      tipo: "momento_like",
      idHighlight: "7",
      idUsuarioRelacionado: AMIGO,
    });
  });

  it("la lista de me gusta ocultos es solo para participantes", async () => {
    highlightRepository.obtenerDetalle.mockResolvedValue(momento({ ocultar_likes: true }));
    await expect(momentoService.listarLikes(DESCONOCIDO, "7")).rejects.toMatchObject({ status: 403 });
  });
});

describe("momentoService comentarios", () => {
  beforeEach(() => {
    highlightRepository.crearComentario.mockResolvedValue({ id_comentario: 9 });
  });

  it("no deja comentar si están desactivados", async () => {
    highlightRepository.obtenerDetalle.mockResolvedValue(momento({ comentarios_activados: false }));
    await expect(momentoService.comentar(DESCONOCIDO, "7", { texto: "hola" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("filtra malas palabras", async () => {
    await expect(momentoService.comentar(DESCONOCIDO, "7", { texto: "sos un pelotudo" })).rejects.toMatchObject({
      status: 400,
    });
    expect(highlightRepository.crearComentario).not.toHaveBeenCalled();
  });

  it("responder una respuesta cuelga del comentario de arriba y avisa a su autor", async () => {
    highlightRepository.obtenerComentario.mockResolvedValue({
      id_comentario: 5,
      id_highlight: 7,
      id_usuario: DESCONOCIDO,
      id_respuesta_a: 2,
    });

    await momentoService.comentar("otro-uuid", "7", { texto: "jaja", idRespuestaA: 5 });

    expect(highlightRepository.crearComentario).toHaveBeenCalledWith(
      expect.objectContaining({ id_respuesta_a: 2 })
    );
    expect(notificacionService.crear).toHaveBeenCalledWith(
      expect.objectContaining({ idUsuario: DESCONOCIDO, descripcion: expect.stringContaining("Respondió") })
    );
  });

  it("un participante puede borrar comentarios ajenos; un extraño no", async () => {
    highlightRepository.obtenerComentario.mockResolvedValue({ id_comentario: 5, id_highlight: 7, id_usuario: DESCONOCIDO });

    highlightRepository.obtenerParticipacion.mockResolvedValue({ estado: "aceptado" });
    await momentoService.eliminarComentario(AMIGO, "7", 5);
    expect(highlightRepository.eliminarComentario).toHaveBeenCalledWith(5);

    highlightRepository.obtenerParticipacion.mockResolvedValue(null);
    await expect(momentoService.eliminarComentario("otro-uuid", "7", 5)).rejects.toMatchObject({ status: 403 });
  });
});

describe("momentoService.editar", () => {
  it("solo el autor, y marca editado si cambia el pie de foto", async () => {
    highlightRepository.obtenerPorId.mockResolvedValue(momento());

    await expect(momentoService.editar(AMIGO, "7", { descripcion: "x" })).rejects.toMatchObject({ status: 403 });

    await momentoService.editar(YO, "7", { descripcion: "Nuevo pie", comentariosActivados: false });
    expect(highlightRepository.actualizar).toHaveBeenCalledWith("7", {
      descripcion: "Nuevo pie",
      comentarios_activados: false,
      editado_at: expect.any(String),
    });
  });

  it("guardar sin cambiar el pie ni el concierto no lo marca editado", async () => {
    highlightRepository.obtenerPorId.mockResolvedValue(momento({ descripcion: "Igual", id_concierto: 3 }));

    await momentoService.editar(YO, "7", { descripcion: "Igual", idConcierto: 3, ocultarLikes: true });

    expect(usuariosConciertosRepository.existeRelacion).not.toHaveBeenCalled();
    expect(highlightRepository.actualizar).toHaveBeenCalledWith("7", { ocultar_likes: true });
  });
});

describe("momentoService fijar", () => {
  it("hasta 3 fijados", async () => {
    highlightRepository.obtenerParticipacion.mockResolvedValue({ estado: "aceptado", fijado_at: null });
    highlightRepository.contarFijados.mockResolvedValue(3);
    await expect(momentoService.fijar(YO, "7")).rejects.toMatchObject({ status: 400 });

    highlightRepository.contarFijados.mockResolvedValue(1);
    await momentoService.fijar(YO, "7");
    expect(highlightRepository.fijar).toHaveBeenCalledWith("7", YO, expect.any(String));
  });

  it("solo se fija algo que está en tu perfil", async () => {
    highlightRepository.obtenerParticipacion.mockResolvedValue({ estado: "pendiente" });
    await expect(momentoService.fijar(YO, "7")).rejects.toMatchObject({ status: 403 });
  });

  it("los fijados van primero en el perfil", async () => {
    highlightRepository.listarPorUsuario.mockResolvedValue([
      momento({ id_highlight: 1, fijado_at: null }),
      momento({ id_highlight: 2, fijado_at: "2026-10-10T00:00:00Z" }),
    ]);
    const lista = await momentoService.listarDeUsuario(YO, YO);
    expect(lista.map((m) => [m.id_highlight, m.fijado])).toEqual([
      [2, true],
      [1, false],
    ]);
  });
});

describe("momentoService aceptar / quitar", () => {
  it("aceptar pasa a aceptado y borra la invitación", async () => {
    highlightRepository.obtenerParticipacion.mockResolvedValue({ estado: "pendiente" });
    await momentoService.aceptar(AMIGO, "7");
    expect(highlightRepository.aceptarParticipacion).toHaveBeenCalledWith("7", AMIGO);
    expect(notificacionRepository.eliminarInvitacionMomento).toHaveBeenCalledWith(AMIGO, "7");
  });

  it("quitar lo saca solo de tu perfil si otros lo tienen", async () => {
    highlightRepository.obtenerParticipacion.mockResolvedValue({ estado: "aceptado" });
    highlightRepository.contarParticipantes.mockResolvedValue(1);

    await momentoService.quitar(YO, "7");

    expect(highlightRepository.quitarParticipacion).toHaveBeenCalledWith("7", YO);
    expect(highlightRepository.eliminar).not.toHaveBeenCalled();
  });

  it("cuando ya no lo tiene nadie, borra todas las fotos", async () => {
    highlightRepository.obtenerParticipacion.mockResolvedValue({ estado: "aceptado" });
    highlightRepository.contarParticipantes.mockResolvedValue(0);
    highlightRepository.listarFotos.mockResolvedValue([{ url_imagen: "a" }, { url_imagen: "b" }]);
    highlightRepository.obtenerPorId.mockResolvedValue({ url_imagen: "a" });

    await momentoService.quitar(YO, "7");

    expect(highlightRepository.eliminar).toHaveBeenCalledWith("7");
    expect(storageRepository.eliminarPorUrl).toHaveBeenCalledTimes(2);
  });
});
