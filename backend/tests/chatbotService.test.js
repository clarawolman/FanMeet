import { describe, it, expect, vi, beforeEach } from "vitest";

// Simula la API de Gemini: cada test define qué JSON devuelve.
const respuestaGemini = vi.fn();
const respuestaOk = async () => ({ ok: true, status: 200, json: async () => respuestaGemini() });
const fetchFalso = vi.fn(respuestaOk);
vi.stubGlobal("fetch", fetchFalso);
process.env.GEMINI_API_KEY = "key-de-prueba";

function cuerpoEnviado() {
  return JSON.parse(fetchFalso.mock.calls[0][1].body);
}

vi.mock("../src/repositories/mensajeChatbotRepository.js", () => ({
  mensajeChatbotRepository: {
    crear: vi.fn(),
    listarDeUsuario: vi.fn(),
    obtenerDeUsuario: vi.fn(),
    cambiarAccion: vi.fn(),
  },
}));

vi.mock("../src/repositories/conciertoRepository.js", () => ({
  conciertoRepository: { listarTodos: vi.fn(), obtenerPorId: vi.fn() },
  usuariosConciertosRepository: { listarConciertosPorUsuario: vi.fn(), existeRelacion: vi.fn() },
}));

vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoRepository: { listarPorConcierto: vi.fn(), obtenerPorId: vi.fn(), listarPorIds: vi.fn() },
  grupoUsuarioRepository: {
    listarGruposPorUsuario: vi.fn(),
    listarUsuariosPorGrupos: vi.fn(),
    listarUsuariosPorGrupo: vi.fn(),
    existeRelacion: vi.fn(),
  },
}));

vi.mock("../src/repositories/estiloMusicalRepository.js", () => ({
  estiloMusicalRepository: { listarCatalogo: vi.fn(), listarIdsPorUsuario: vi.fn() },
}));

vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: { obtenerPorId: vi.fn() },
}));

vi.mock("../src/repositories/artistaFavoritoRepository.js", () => ({
  artistaFavoritoRepository: { listarPorUsuario: vi.fn() },
}));

vi.mock("../src/services/usuarioService.js", () => ({
  usuarioService: { obtenerEstadisticas: vi.fn() },
}));

vi.mock("../src/services/grupoService.js", async () => {
  const { usuariosConciertosRepository } = await import("../src/repositories/conciertoRepository.js");
  return {
    grupoService: { unirse: vi.fn() },
    perteneceAlConciertoDelGrupo: async (idUsuario, grupo) =>
      Boolean(await usuariosConciertosRepository.existeRelacion(idUsuario, grupo.id_concierto)),
  };
});

vi.mock("../src/repositories/bloqueoRepository.js", () => ({
  bloqueoRepository: { idsConBloqueo: vi.fn() },
}));

const { mensajeChatbotRepository } = await import("../src/repositories/mensajeChatbotRepository.js");
const { conciertoRepository, usuariosConciertosRepository } = await import(
  "../src/repositories/conciertoRepository.js"
);
const { grupoRepository, grupoUsuarioRepository } = await import("../src/repositories/grupoRepository.js");
const { estiloMusicalRepository } = await import("../src/repositories/estiloMusicalRepository.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { artistaFavoritoRepository } = await import("../src/repositories/artistaFavoritoRepository.js");
const { usuarioService } = await import("../src/services/usuarioService.js");
const { grupoService } = await import("../src/services/grupoService.js");
const { bloqueoRepository } = await import("../src/repositories/bloqueoRepository.js");
const { chatbotService } = await import("../src/services/chatbotService.js");

const YO = "yo-uuid";

beforeEach(() => {
  vi.clearAllMocks();
  fetchFalso.mockReset().mockImplementation(respuestaOk);

  let siguienteId = 1;
  mensajeChatbotRepository.crear.mockImplementation(async ({ idUsuario, rol, contenido, accion }) => ({
    id_mensaje: siguienteId++,
    id_usuario: idUsuario,
    rol,
    contenido,
    accion: accion ?? null,
    created_at: "2026-10-09T12:00:00Z",
  }));
  bloqueoRepository.idsConBloqueo.mockResolvedValue(new Set());
  mensajeChatbotRepository.listarDeUsuario.mockResolvedValue([
    { id_mensaje: 1, id_usuario: YO, rol: "user", contenido: "¿qué grupos hay?" },
  ]);

  estiloMusicalRepository.listarCatalogo.mockResolvedValue([{ id_estilo: 2, nombre: "Rock" }]);
  estiloMusicalRepository.listarIdsPorUsuario.mockResolvedValue([{ id_estilo: 2 }]);
  usuarioRepository.obtenerPorId.mockResolvedValue({
    id_usuario: YO,
    nombre: "clara",
    mail: "clara@mail.com",
    fechanac: "2004-03-21",
    estilo_asistencia: "campo",
  });
  artistaFavoritoRepository.listarPorUsuario.mockResolvedValue([{ spotify_id: "x", nombre: "Soda Stereo" }]);
  usuarioService.obtenerEstadisticas.mockResolvedValue({ conciertos: 1, grupos: 1, amigos: 3 });
  conciertoRepository.listarTodos.mockResolvedValue([
    { id_concierto: 1, nombre: "Unido Fest", id_estiloMusical: 2, fecha: "2099-01-01" },
    { id_concierto: 2, nombre: "Ajeno Fest", id_estiloMusical: 2, fecha: "2099-02-01" },
  ]);
  usuariosConciertosRepository.listarConciertosPorUsuario.mockResolvedValue([{ id_concierto: 1 }]);
  grupoRepository.listarPorConcierto.mockImplementation(async (idConcierto) =>
    idConcierto === 1
      ? [{ id_grupo: 10, nombre: "Previa del unido", categoria: "pre" }]
      : [{ id_grupo: 20, nombre: "Grupo secreto ajeno", categoria: "after" }]
  );
  grupoUsuarioRepository.listarGruposPorUsuario.mockResolvedValue([]);
  grupoUsuarioRepository.listarUsuariosPorGrupos.mockResolvedValue([{ id_grupo: 10, id_usuario: YO }]);

  respuestaGemini.mockReturnValue({
    candidates: [{ finishReason: "STOP", content: { parts: [{ text: "Hay una previa 🎸" }] } }],
  });
});

function textoDelSystem() {
  return cuerpoEnviado().systemInstruction.parts.map((p) => p.text).join("\n");
}

describe("chatbotService.enviar", () => {
  it("solo le pasa a la IA los grupos de los conciertos a los que el usuario está unido", async () => {
    await chatbotService.enviar(YO, "¿qué grupos hay?");

    expect(grupoRepository.listarPorConcierto).toHaveBeenCalledTimes(1);
    expect(grupoRepository.listarPorConcierto).toHaveBeenCalledWith(1);

    const system = textoDelSystem();
    expect(system).toContain("Previa del unido");
    expect(system).not.toContain("Grupo secreto ajeno");
    // el concierto ajeno sí aparece como próximo concierto, sin sus grupos
    expect(system).toContain("Ajeno Fest");
    expect(system).toContain("Rock");
  });

  it("le pasa a la IA el perfil del usuario, sin mail ni fecha de nacimiento", async () => {
    await chatbotService.enviar(YO, "¿cuáles son mis artistas favoritos?");

    const system = textoDelSystem();
    expect(system).toContain("clara");
    expect(system).toContain("Soda Stereo");
    expect(system).toContain("Primera Fila");
    expect(system).toContain('"generos_favoritos":["Rock"]');
    expect(system).toContain('"cantidad_de_amigos":3');
    expect(system).not.toContain("clara@mail.com");
    expect(system).not.toContain("2004-03-21");
  });

  it("guarda el mensaje del usuario y la respuesta de la IA", async () => {
    const resultado = await chatbotService.enviar(YO, "  hola  ");

    expect(mensajeChatbotRepository.crear).toHaveBeenNthCalledWith(1, {
      idUsuario: YO,
      rol: "user",
      contenido: "hola",
    });
    expect(resultado.mensajeUsuario).toMatchObject({ id_emisor: YO, contenido: "hola" });
    expect(resultado.respuesta).toMatchObject({ id_emisor: "fanmeet-bot", contenido: "Hay una previa 🎸" });
  });

  it("si la IA rechaza la consulta responde con un mensaje que sugiere el mail de quejas", async () => {
    respuestaGemini.mockReturnValue({ promptFeedback: { blockReason: "SAFETY" } });

    const { respuesta } = await chatbotService.enviar(YO, "algo raro");

    expect(respuesta.contenido).toContain("fanmeet100@gmail.com");
  });

  it("el historial que se manda arranca siempre con un mensaje del usuario", async () => {
    mensajeChatbotRepository.listarDeUsuario.mockResolvedValue([
      { id_mensaje: 1, id_usuario: YO, rol: "assistant", contenido: "respuesta vieja" },
      { id_mensaje: 2, id_usuario: YO, rol: "user", contenido: "nueva pregunta" },
    ]);

    await chatbotService.enviar(YO, "nueva pregunta");

    expect(cuerpoEnviado().contents).toEqual([{ role: "user", parts: [{ text: "nueva pregunta" }] }]);
  });

  it("si el modelo principal está saturado (503) responde con el de respaldo", async () => {
    fetchFalso.mockResolvedValueOnce({ ok: false, status: 503, text: async () => "" });

    const { respuesta } = await chatbotService.enviar(YO, "hola");

    expect(fetchFalso).toHaveBeenCalledTimes(2);
    expect(fetchFalso.mock.calls[0][0]).not.toBe(fetchFalso.mock.calls[1][0]);
    expect(respuesta.contenido).toBe("Hay una previa 🎸");
  });

  it("si todos los modelos están saturados (429) devuelve un error amigable", async () => {
    const saturado = { ok: false, status: 429, text: async () => "" };
    fetchFalso.mockResolvedValue(saturado);

    await expect(chatbotService.enviar(YO, "hola")).rejects.toMatchObject({ status: 429 });
  });
});

// Respuestas de Gemini para el function calling.
const pideHerramienta = (name, args = {}) => ({
  candidates: [{ content: { role: "model", parts: [{ functionCall: { name, args } }] } }],
});
const responde = (text) => ({ candidates: [{ finishReason: "STOP", content: { parts: [{ text }] } }] });

function respuestaDeHerramienta(numeroDePedido) {
  const { contents } = JSON.parse(fetchFalso.mock.calls[numeroDePedido][1].body);
  return contents.at(-1).parts[0].functionResponse;
}

describe("herramientas de Fani", () => {
  beforeEach(() => {
    grupoRepository.listarPorConcierto.mockImplementation(async (idConcierto) =>
      idConcierto === 1
        ? [
            { id_grupo: 10, id_concierto: 1, nombre: "Previa con lugar", categoria: "pre", cupo: 5, fecha: "2099-01-01", id_creador: "ana" },
            { id_grupo: 11, id_concierto: 1, nombre: "After lleno", categoria: "after", cupo: 2, fecha: "2099-01-01", id_creador: "ana" },
            { id_grupo: 12, id_concierto: 1, nombre: "Mi grupo", categoria: "pre", fecha: "2099-01-01", id_creador: YO },
            { id_grupo: 13, id_concierto: 1, nombre: "Grupo del bloqueado", categoria: "pre", fecha: "2099-01-01", id_creador: "malo" },
          ]
        : [{ id_grupo: 20, id_concierto: 2, nombre: "Grupo secreto ajeno", categoria: "after" }]
    );
    grupoUsuarioRepository.listarGruposPorUsuario.mockResolvedValue([{ id_grupo: 12 }]);
    grupoUsuarioRepository.listarUsuariosPorGrupos.mockResolvedValue([
      { id_grupo: 10, id_usuario: "ana" },
      { id_grupo: 11, id_usuario: "ana" },
      { id_grupo: 11, id_usuario: "beto" },
      { id_grupo: 12, id_usuario: YO },
    ]);
    bloqueoRepository.idsConBloqueo.mockResolvedValue(new Set(["malo"]));
  });

  it("no le pasa a la IA los grupos que creó alguien con quien hay un bloqueo", async () => {
    await chatbotService.enviar(YO, "¿qué grupos hay?");

    expect(textoDelSystem()).toContain("Previa con lugar");
    expect(textoDelSystem()).not.toContain("Grupo del bloqueado");
  });

  it("buscar_grupos_con_lugar: solo grupos de sus conciertos, con lugar, sin los suyos ni los de bloqueados", async () => {
    respuestaGemini
      .mockReturnValueOnce(pideHerramienta("buscar_grupos_con_lugar"))
      .mockReturnValueOnce(responde("Hay una previa con lugar 🎸"));

    const { respuesta } = await chatbotService.enviar(YO, "¿hay grupos con lugar?");

    expect(respuesta.contenido).toBe("Hay una previa con lugar 🎸");
    const { name, response } = respuestaDeHerramienta(1);
    expect(name).toBe("buscar_grupos_con_lugar");
    expect(response.grupos.map((g) => g.nombre)).toEqual(["Previa con lugar"]);
    expect(response.grupos[0]).toMatchObject({ id_grupo: 10, integrantes: 1, lugares_libres: 4 });
    // Nunca datos de otros usuarios, solo cuántos son.
    expect(JSON.stringify(response)).not.toContain("ana");
  });

  it("buscar_grupos_con_lugar en un concierto al que no está unido devuelve un error de privacidad", async () => {
    respuestaGemini
      .mockReturnValueOnce(pideHerramienta("buscar_grupos_con_lugar", { id_concierto: 2 }))
      .mockReturnValueOnce(responde("Esos grupos son privados"));

    await chatbotService.enviar(YO, "¿grupos de Ajeno Fest?");

    const { response } = respuestaDeHerramienta(1);
    expect(response.error).toMatch(/privados/);
    expect(JSON.stringify(response)).not.toContain("Grupo secreto ajeno");
  });

  it("mis_grupos_y_proximos_eventos: sus conciertos próximos y sus grupos", async () => {
    grupoRepository.listarPorIds.mockResolvedValue([
      { id_grupo: 12, id_concierto: 1, nombre: "Mi grupo", categoria: "pre", fecha: "2099-01-01", hora: "19:00:00", id_creador: YO },
    ]);
    respuestaGemini
      .mockReturnValueOnce(pideHerramienta("mis_grupos_y_proximos_eventos"))
      .mockReturnValueOnce(responde("Tenés Unido Fest"));

    await chatbotService.enviar(YO, "¿qué tengo?");

    const { response } = respuestaDeHerramienta(1);
    expect(response.proximos_conciertos.map((c) => c.nombre)).toEqual(["Unido Fest"]);
    expect(response.mis_grupos).toEqual([
      expect.objectContaining({ nombre: "Mi grupo", hora: "19:00", lo_creo_el_usuario: true }),
    ]);
  });

  it("proponer_unirse_a_grupo no suma al usuario: guarda la propuesta en la respuesta de Fani", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 10, id_concierto: 1, nombre: "Previa con lugar", cupo: 5, fecha: "2099-01-01", id_creador: "ana" });
    usuariosConciertosRepository.existeRelacion.mockResolvedValue({ id: 1 });
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);
    grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([{ id_usuario: "ana" }]);
    conciertoRepository.obtenerPorId.mockResolvedValue({ id_concierto: 1, nombre: "Unido Fest", fecha: "2099-01-01" });
    respuestaGemini
      .mockReturnValueOnce(pideHerramienta("proponer_unirse_a_grupo", { id_grupo: 10 }))
      .mockReturnValueOnce(responde("¿Te sumo a Previa con lugar? Tocá Confirmar"));

    const { respuesta } = await chatbotService.enviar(YO, "sumame a la previa");

    expect(grupoService.unirse).not.toHaveBeenCalled();
    expect(respuesta.accion).toEqual({
      tipo: "unirse_grupo",
      estado: "pendiente",
      id_grupo: 10,
      grupo: "Previa con lugar",
      concierto: "Unido Fest",
    });
    expect(respuestaDeHerramienta(1).response.ok).toBe(true);
  });

  it("proponer_unirse_a_grupo de un concierto al que no está unido no deja propuesta", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 20, id_concierto: 2, nombre: "Grupo secreto ajeno", id_creador: "ana" });
    usuariosConciertosRepository.existeRelacion.mockResolvedValue(null);
    respuestaGemini
      .mockReturnValueOnce(pideHerramienta("proponer_unirse_a_grupo", { id_grupo: 20 }))
      .mockReturnValueOnce(responde("No estás en ese concierto"));

    const { respuesta } = await chatbotService.enviar(YO, "sumame al 20");

    expect(respuesta.accion).toBeNull();
    expect(respuestaDeHerramienta(1).response.error).toMatch(/código de acceso/);
  });

  it("si el grupo lo creó alguien con bloqueo, responde que no existe", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 13, id_concierto: 1, nombre: "Grupo del bloqueado", id_creador: "malo" });
    respuestaGemini
      .mockReturnValueOnce(pideHerramienta("proponer_unirse_a_grupo", { id_grupo: 13 }))
      .mockReturnValueOnce(responde("No encontré ese grupo"));

    const { respuesta } = await chatbotService.enviar(YO, "sumame al 13");

    expect(respuesta.accion).toBeNull();
    expect(respuestaDeHerramienta(1).response.error).toBe("Ese grupo no existe");
  });

  it("le cuenta a la IA qué pasó con sus propuestas anteriores", async () => {
    mensajeChatbotRepository.listarDeUsuario.mockResolvedValue([
      { id_mensaje: 1, rol: "user", contenido: "sumame" },
      { id_mensaje: 2, rol: "assistant", contenido: "¿Te sumo?", accion: { tipo: "unirse_grupo", estado: "cancelada", grupo: "Previa" } },
      { id_mensaje: 3, rol: "user", contenido: "¿y ahora?" },
    ]);

    await chatbotService.enviar(YO, "¿y ahora?");

    expect(cuerpoEnviado().contents[1].parts[0].text).toContain('[propuesta: sumarse al grupo "Previa" — el usuario la canceló]');
  });
});

describe("chatbotService.resolverAccion", () => {
  const ACCION = { tipo: "unirse_grupo", estado: "pendiente", id_grupo: 10, grupo: "Previa", concierto: "Unido Fest" };

  beforeEach(() => {
    mensajeChatbotRepository.obtenerDeUsuario.mockResolvedValue({ id_mensaje: 5, id_usuario: YO, rol: "assistant", contenido: "¿Te sumo?", accion: ACCION });
    mensajeChatbotRepository.cambiarAccion.mockImplementation(async (id, _estado, accion) => ({ id_mensaje: id, id_usuario: YO, rol: "assistant", contenido: "¿Te sumo?", accion }));
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 10, id_concierto: 1, nombre: "Previa", fecha: "2099-01-01", id_creador: "ana" });
    usuariosConciertosRepository.existeRelacion.mockResolvedValue({ id: 1 });
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);
    conciertoRepository.obtenerPorId.mockResolvedValue({ id_concierto: 1, nombre: "Unido Fest", fecha: "2099-01-01" });
    grupoService.unirse.mockResolvedValue({ ok: true, yaConfirmado: false });
  });

  it("al confirmar lo suma con grupoService.unirse y Fani le recuerda los consejos de seguridad", async () => {
    const { mensaje, respuesta } = await chatbotService.resolverAccion(YO, 5, "confirmar");

    expect(mensajeChatbotRepository.cambiarAccion).toHaveBeenCalledWith(5, "pendiente", { ...ACCION, estado: "hecha" });
    expect(grupoService.unirse).toHaveBeenCalledWith(YO, 10);
    expect(mensaje.accion.estado).toBe("hecha");
    expect(respuesta.contenido).toContain('ya estás en "Previa"');
    expect(respuesta.contenido).toContain("alguien de confianza");
    expect(respuesta.contenido).toContain("reportá y bloqueá");
  });

  it("al cancelar no lo suma", async () => {
    const { mensaje, respuesta } = await chatbotService.resolverAccion(YO, 5, "cancelar");

    expect(grupoService.unirse).not.toHaveBeenCalled();
    expect(mensaje.accion.estado).toBe("cancelada");
    expect(respuesta).toBeNull();
  });

  it("no se puede resolver dos veces", async () => {
    mensajeChatbotRepository.obtenerDeUsuario.mockResolvedValue({ id_mensaje: 5, accion: { ...ACCION, estado: "hecha" } });

    await expect(chatbotService.resolverAccion(YO, 5, "confirmar")).rejects.toMatchObject({ status: 409 });
    expect(grupoService.unirse).not.toHaveBeenCalled();
  });

  it("si otro Confirmar ganó la carrera, no lo suma de nuevo", async () => {
    mensajeChatbotRepository.cambiarAccion.mockResolvedValue(null);

    await expect(chatbotService.resolverAccion(YO, 5, "confirmar")).rejects.toMatchObject({ status: 409 });
    expect(grupoService.unirse).not.toHaveBeenCalled();
  });

  it("si el grupo se llenó, la propuesta vuelve a quedar pendiente", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 10, id_concierto: 1, nombre: "Previa", cupo: 1, fecha: "2099-01-01", id_creador: "ana" });
    grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([{ id_usuario: "ana" }]);

    await expect(chatbotService.resolverAccion(YO, 5, "confirmar")).rejects.toMatchObject({ status: 409 });
    expect(grupoService.unirse).not.toHaveBeenCalled();
    expect(mensajeChatbotRepository.cambiarAccion).toHaveBeenLastCalledWith(5, "hecha", ACCION);
  });

  it("un mensaje de otro usuario o sin propuesta da 404", async () => {
    mensajeChatbotRepository.obtenerDeUsuario.mockResolvedValue(null);

    await expect(chatbotService.resolverAccion(YO, 99, "confirmar")).rejects.toMatchObject({ status: 404 });
  });
});
