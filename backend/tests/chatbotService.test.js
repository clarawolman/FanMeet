import { describe, it, expect, vi, beforeEach } from "vitest";

// Simula la API de Groq: cada test define qué JSON devuelve.
const respuestaGroq = vi.fn();
const respuestaOk = async () => ({ ok: true, status: 200, json: async () => respuestaGroq() });
const fetchFalso = vi.fn(respuestaOk);
vi.stubGlobal("fetch", fetchFalso);
process.env.GROQ_API_KEY = "key-de-prueba";

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

vi.mock("../src/services/conciertoService.js", () => ({
  conciertoService: { unirsePorCodigo: vi.fn() },
}));

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
const { conciertoService } = await import("../src/services/conciertoService.js");
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

  respuestaGroq.mockReturnValue(responde("Hay una previa 🎸"));
});

function textoDelSystem() {
  const [system] = cuerpoEnviado().messages;
  expect(system.role).toBe("system");
  return system.content;
}

// Lo que se le mandó a la IA como conversación (sin el system).
function conversacionEnviada(numeroDePedido = 0) {
  return JSON.parse(fetchFalso.mock.calls[numeroDePedido][1].body).messages.slice(1);
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
    respuestaGroq.mockReturnValue({ choices: [{ finish_reason: "content_filter", message: { content: "" } }] });

    const { respuesta } = await chatbotService.enviar(YO, "algo raro");

    expect(respuesta.contenido).toContain("fanmeet100@gmail.com");
  });

  it("el historial que se manda arranca siempre con un mensaje del usuario", async () => {
    mensajeChatbotRepository.listarDeUsuario.mockResolvedValue([
      { id_mensaje: 1, id_usuario: YO, rol: "assistant", contenido: "respuesta vieja" },
      { id_mensaje: 2, id_usuario: YO, rol: "user", contenido: "nueva pregunta" },
    ]);

    await chatbotService.enviar(YO, "nueva pregunta");

    expect(conversacionEnviada()).toEqual([{ role: "user", content: "nueva pregunta" }]);
  });

  it("si el modelo principal está saturado (503) responde con el de respaldo", async () => {
    fetchFalso.mockResolvedValueOnce({ ok: false, status: 503, text: async () => "" });

    const { respuesta } = await chatbotService.enviar(YO, "hola");

    expect(fetchFalso).toHaveBeenCalledTimes(2);
    const modelo = (n) => JSON.parse(fetchFalso.mock.calls[n][1].body).model;
    expect(modelo(0)).not.toBe(modelo(1));
    expect(respuesta.contenido).toBe("Hay una previa 🎸");
  });

  it("si un modelo arma mal una herramienta (400 tool_use_failed) prueba con otro", async () => {
    fetchFalso.mockResolvedValueOnce({ ok: false, status: 400, text: async () => '{"error":{"code":"tool_use_failed"}}' });

    const { respuesta } = await chatbotService.enviar(YO, "hola");

    expect(fetchFalso).toHaveBeenCalledTimes(2);
    expect(respuesta.contenido).toBe("Hay una previa 🎸");
  });

  it("solo a los gpt-oss les pide pensar poco (los demás modelos lo rechazan)", async () => {
    fetchFalso
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => "" })
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => "" });

    await chatbotService.enviar(YO, "hola");

    const cuerpo = (n) => JSON.parse(fetchFalso.mock.calls[n][1].body);
    expect(cuerpo(0)).toMatchObject({ model: "openai/gpt-oss-120b", reasoning_effort: "low" });
    expect(cuerpo(2).model).toBe("qwen/qwen3.8-27b");
    expect(cuerpo(2)).not.toHaveProperty("reasoning_effort");
    expect(cuerpo(2).tools.map((h) => h.function.name)).toContain("mis_grupos_y_proximos_eventos");
  });

  it("si todos están sin cuota por unos segundos, espera lo que dice Groq y reintenta", async () => {
    const sinCuota = { ok: false, status: 429, text: async () => "Please try again in 0.05s" };
    fetchFalso.mockResolvedValueOnce(sinCuota).mockResolvedValueOnce(sinCuota).mockResolvedValueOnce(sinCuota);

    const { respuesta } = await chatbotService.enviar(YO, "hola");

    expect(fetchFalso).toHaveBeenCalledTimes(4);
    expect(respuesta.contenido).toBe("Hay una previa 🎸");
  });

  it("si un modelo ya no existe (404) prueba con otro", async () => {
    fetchFalso.mockResolvedValueOnce({ ok: false, status: 404, text: async () => '{"error":{"code":"model_not_found"}}' });

    const { respuesta } = await chatbotService.enviar(YO, "hola");

    expect(fetchFalso).toHaveBeenCalledTimes(2);
    expect(respuesta.contenido).toBe("Hay una previa 🎸");
  });

  it("con la key inválida avisa que el chatbot está mal configurado", async () => {
    fetchFalso.mockResolvedValueOnce({ ok: false, status: 401, text: async () => '{"error":{"code":"invalid_api_key"}}' });

    await expect(chatbotService.enviar(YO, "hola")).rejects.toMatchObject({ status: 503 });
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it("si todos los modelos están saturados (429) devuelve un error amigable", async () => {
    const saturado = { ok: false, status: 429, text: async () => "" };
    fetchFalso.mockResolvedValue(saturado);

    await expect(chatbotService.enviar(YO, "hola")).rejects.toMatchObject({ status: 429 });
  });
});

// Respuestas de Groq para el function calling (formato de OpenAI).
function pideHerramienta(name, args = {}) {
  return {
    choices: [
      {
        finish_reason: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [{ id: "llamada-1", type: "function", function: { name, arguments: JSON.stringify(args) } }],
        },
      },
    ],
  };
}
function responde(content) {
  return { choices: [{ finish_reason: "stop", message: { role: "assistant", content } }] };
}

// Lo que se le devolvió a la IA de la herramienta, en el pedido N.
function respuestaDeHerramienta(numeroDePedido) {
  const mensajes = conversacionEnviada(numeroDePedido);
  const herramienta = mensajes.at(-1);
  expect(herramienta).toMatchObject({ role: "tool", tool_call_id: "llamada-1" });
  const pedido = mensajes.at(-2).tool_calls[0].function;
  return { name: pedido.name, response: JSON.parse(herramienta.content) };
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
    respuestaGroq
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
    respuestaGroq
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
    respuestaGroq
      .mockReturnValueOnce(pideHerramienta("mis_grupos_y_proximos_eventos"))
      .mockReturnValueOnce(responde("Tenés Unido Fest"));

    await chatbotService.enviar(YO, "¿qué tengo?");

    const { response } = respuestaDeHerramienta(1);
    expect(response.proximos_conciertos.map((c) => c.nombre)).toEqual(["Unido Fest"]);
    expect(response.mis_grupos).toEqual([
      expect.objectContaining({ nombre: "Mi grupo", hora: "19:00", lo_creo_el_usuario: true }),
    ]);
  });

  it("mostrar_grupos no suma al usuario: guarda una tarjeta por grupo en la respuesta de Fani", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 10, id_concierto: 1, nombre: "Previa con lugar", categoria: "pre", cupo: 5, fecha: "2099-01-01", hora: "19:30:00", ubicacion: "Bar X", id_creador: "ana" });
    usuariosConciertosRepository.existeRelacion.mockResolvedValue({ id: 1 });
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);
    grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([{ id_usuario: "ana" }]);
    conciertoRepository.obtenerPorId.mockResolvedValue({ id_concierto: 1, nombre: "Unido Fest", fecha: "2099-01-01" });
    respuestaGroq
      .mockReturnValueOnce(pideHerramienta("mostrar_grupos", { ids_grupo: [10] }))
      .mockReturnValueOnce(responde("Este te puede gustar, tocá Unirme"));

    const { respuesta } = await chatbotService.enviar(YO, "sumame a la previa");

    expect(grupoService.unirse).not.toHaveBeenCalled();
    expect(respuesta.accion).toEqual({
      tipo: "tarjetas",
      estado: "pendiente",
      conciertos: [],
      grupos: [
        {
          id_grupo: 10,
          nombre: "Previa con lugar",
          categoria: "pre",
          concierto: "Unido Fest",
          fecha: "2099-01-01",
          hora: "19:30",
          punto_de_encuentro: "Bar X",
          integrantes: 1,
          cupo: 5,
          unido: false,
        },
      ],
    });
    expect(respuestaDeHerramienta(1).response.ok).toBe(true);
  });

  it("mostrar_grupos de un concierto al que no está unido no deja tarjetas", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 20, id_concierto: 2, nombre: "Grupo secreto ajeno", id_creador: "ana" });
    usuariosConciertosRepository.existeRelacion.mockResolvedValue(null);
    respuestaGroq
      .mockReturnValueOnce(pideHerramienta("mostrar_grupos", { ids_grupo: [20] }))
      .mockReturnValueOnce(responde("No estás en ese concierto"));

    const { respuesta } = await chatbotService.enviar(YO, "sumame al 20");

    expect(respuesta.accion).toBeNull();
    expect(respuestaDeHerramienta(1).response.error).toMatch(/código de acceso/);
  });

  it("si el grupo lo creó alguien con bloqueo, responde que no existe", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 13, id_concierto: 1, nombre: "Grupo del bloqueado", id_creador: "malo" });
    respuestaGroq
      .mockReturnValueOnce(pideHerramienta("mostrar_grupos", { ids_grupo: [13] }))
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

    expect(conversacionEnviada()[1].content).toContain('[propuesta: sumarse al grupo "Previa" — el usuario la canceló]');
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

describe("chatbotService.resolverAccion con tarjetas de grupos", () => {
  const tarjeta = (id, nombre) => ({ id_grupo: id, nombre, categoria: "pre", concierto: "Unido Fest", integrantes: 1, cupo: 5, unido: false });
  const ACCION = { tipo: "tarjetas", estado: "pendiente", grupos: [tarjeta(10, "Previa"), tarjeta(11, "After")], conciertos: [] };

  beforeEach(() => {
    mensajeChatbotRepository.obtenerDeUsuario.mockResolvedValue({ id_mensaje: 5, id_usuario: YO, rol: "assistant", contenido: "Mirá", accion: ACCION });
    mensajeChatbotRepository.cambiarAccion.mockImplementation(async (id, _estado, accion) => ({ id_mensaje: id, id_usuario: YO, rol: "assistant", contenido: "Mirá", accion }));
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 10, id_concierto: 1, nombre: "Previa", fecha: "2099-01-01", id_creador: "ana" });
    usuariosConciertosRepository.existeRelacion.mockResolvedValue({ id: 1 });
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);
    conciertoRepository.obtenerPorId.mockResolvedValue({ id_concierto: 1, nombre: "Unido Fest", fecha: "2099-01-01" });
    grupoService.unirse.mockResolvedValue({ ok: true, yaConfirmado: false });
  });

  it("al tocar Unirme lo suma a ese grupo y las otras tarjetas siguen disponibles", async () => {
    const { mensaje, respuesta } = await chatbotService.resolverAccion(YO, 5, "confirmar", { idGrupo: 10 });

    expect(mensajeChatbotRepository.cambiarAccion).toHaveBeenNthCalledWith(1, 5, "pendiente", { ...ACCION, estado: "uniendo" });
    expect(grupoService.unirse).toHaveBeenCalledWith(YO, 10);
    expect(mensaje.accion.estado).toBe("pendiente");
    expect(mensaje.accion.grupos.map((g) => g.unido)).toEqual([true, false]);
    expect(mensaje.accion.grupos[0].integrantes).toBe(2);
    expect(respuesta.contenido).toContain('ya estás en "Previa"');
  });

  it("cuando se sumó a todas las tarjetas queda hecha", async () => {
    mensajeChatbotRepository.obtenerDeUsuario.mockResolvedValue({
      id_mensaje: 5,
      accion: { ...ACCION, grupos: [{ ...tarjeta(10, "Previa"), unido: true }, tarjeta(11, "After")] },
    });
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 11, id_concierto: 1, nombre: "After", fecha: "2099-01-01", id_creador: "ana" });

    const { mensaje } = await chatbotService.resolverAccion(YO, 5, "confirmar", { idGrupo: 11 });

    expect(mensaje.accion.estado).toBe("hecha");
  });

  it("si ya está en ese grupo de la tarjeta no lo suma de nuevo", async () => {
    mensajeChatbotRepository.obtenerDeUsuario.mockResolvedValue({
      id_mensaje: 5,
      accion: { ...ACCION, grupos: [{ ...tarjeta(10, "Previa"), unido: true }] },
    });

    await expect(chatbotService.resolverAccion(YO, 5, "confirmar", { idGrupo: 10 })).rejects.toMatchObject({ status: 409 });
    expect(grupoService.unirse).not.toHaveBeenCalled();
  });

  it("si otro toque está sumándolo, no lo suma dos veces", async () => {
    mensajeChatbotRepository.cambiarAccion.mockResolvedValue(null);

    await expect(chatbotService.resolverAccion(YO, 5, "confirmar", { idGrupo: 10 })).rejects.toMatchObject({ status: 409 });
    expect(grupoService.unirse).not.toHaveBeenCalled();
  });

  it("si el grupo se llenó, la tarjeta vuelve a quedar como estaba", async () => {
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 10, id_concierto: 1, nombre: "Previa", cupo: 1, fecha: "2099-01-01", id_creador: "ana" });
    grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([{ id_usuario: "ana" }]);

    await expect(chatbotService.resolverAccion(YO, 5, "confirmar", { idGrupo: 10 })).rejects.toMatchObject({ status: 409 });
    expect(grupoService.unirse).not.toHaveBeenCalled();
    expect(mensajeChatbotRepository.cambiarAccion).toHaveBeenLastCalledWith(5, "uniendo", ACCION);
  });

  it("un grupo que no está en las tarjetas da 404", async () => {
    await expect(chatbotService.resolverAccion(YO, 5, "confirmar", { idGrupo: 99 })).rejects.toMatchObject({ status: 404 });
    expect(grupoService.unirse).not.toHaveBeenCalled();
  });

  it("le cuenta a la IA a qué tarjetas se sumó", async () => {
    mensajeChatbotRepository.listarDeUsuario.mockResolvedValue([
      { id_mensaje: 1, rol: "user", contenido: "grupos?" },
      { id_mensaje: 2, rol: "assistant", contenido: "Mirá", accion: { ...ACCION, grupos: [{ ...tarjeta(10, "Previa"), unido: true }, tarjeta(11, "After")] } },
      { id_mensaje: 3, rol: "user", contenido: "¿y ahora?" },
    ]);

    await chatbotService.enviar(YO, "¿y ahora?");

    expect(conversacionEnviada()[1].content).toContain('[tarjetas con botón Unirme: "Previa" (se unió), "After" (no se unió)]');
  });
});

describe("tarjetas de conciertos", () => {
  const CONCIERTO = {
    id_concierto: 3,
    nombre: "Duki en River",
    fecha: "2099-11-20T21:00:00",
    artista: { nombre: "Duki" },
    estadio: { nombre: "River", ciudad: "CABA" },
    usuarios_conciertos: [{ count: 40 }],
  };

  it("mostrar_conciertos deja una tarjeta por concierto, sin el código", async () => {
    conciertoRepository.listarTodos.mockResolvedValue([CONCIERTO, { ...CONCIERTO, id_concierto: 4, fecha: "2000-01-01" }]);
    usuariosConciertosRepository.listarConciertosPorUsuario.mockResolvedValue([]);
    respuestaGroq
      .mockReturnValueOnce(pideHerramienta("mostrar_conciertos", { ids_concierto: [3, 4] }))
      .mockReturnValueOnce(responde("Escribí el código y tocá Unirme"));

    const { respuesta } = await chatbotService.enviar(YO, "quiero ir a Duki");

    expect(conciertoService.unirsePorCodigo).not.toHaveBeenCalled();
    expect(respuesta.accion).toEqual({
      tipo: "tarjetas",
      estado: "pendiente",
      grupos: [],
      conciertos: [
        {
          id_concierto: 3,
          nombre: "Duki en River",
          artista: "Duki",
          fecha: "2099-11-20",
          hora: "21:00",
          estadio: "River",
          ciudad: "CABA",
          imagen: "",
          fans_unidos: 40,
          unido: false,
        },
      ],
    });
    expect(respuestaDeHerramienta(1).response.no_se_pudieron_mostrar).toEqual([
      { id_concierto: 4, error: "Ese concierto ya pasó" },
    ]);
  });

  it("si en la misma respuesta muestra grupos y conciertos, van todas las tarjetas juntas", async () => {
    conciertoRepository.listarTodos.mockResolvedValue([CONCIERTO]);
    usuariosConciertosRepository.listarConciertosPorUsuario.mockResolvedValue([]);
    grupoRepository.obtenerPorId.mockResolvedValue({ id_grupo: 10, id_concierto: 1, nombre: "Previa", fecha: "2099-01-01", id_creador: "ana" });
    usuariosConciertosRepository.existeRelacion.mockResolvedValue({ id: 1 });
    grupoUsuarioRepository.existeRelacion.mockResolvedValue(null);
    grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([]);
    conciertoRepository.obtenerPorId.mockResolvedValue({ id_concierto: 1, nombre: "Unido Fest", fecha: "2099-01-01" });
    respuestaGroq
      .mockReturnValueOnce(pideHerramienta("mostrar_conciertos", { ids_concierto: [3] }))
      .mockReturnValueOnce(pideHerramienta("mostrar_grupos", { ids_grupo: [10] }))
      .mockReturnValueOnce(responde("Mirá"));

    const { respuesta } = await chatbotService.enviar(YO, "¿qué hay?");

    expect(respuesta.accion.conciertos.map((c) => c.id_concierto)).toEqual([3]);
    expect(respuesta.accion.grupos.map((g) => g.id_grupo)).toEqual([10]);
  });

  describe("unirse desde la tarjeta", () => {
    const tarjeta = { id_concierto: 3, nombre: "Duki en River", fans_unidos: 40, unido: false };
    const ACCION = { tipo: "tarjetas", estado: "pendiente", grupos: [], conciertos: [tarjeta] };

    beforeEach(() => {
      mensajeChatbotRepository.obtenerDeUsuario.mockResolvedValue({ id_mensaje: 5, accion: ACCION });
      mensajeChatbotRepository.cambiarAccion.mockImplementation(async (id, _estado, accion) => ({ id_mensaje: id, rol: "assistant", contenido: "Mirá", accion }));
      conciertoService.unirsePorCodigo.mockResolvedValue({ ok: true, yaUnido: false });
    });

    it("con el código lo une al concierto y la tarjeta queda unida", async () => {
      const { mensaje, respuesta } = await chatbotService.resolverAccion(YO, 5, "confirmar", { idConcierto: 3, codigo: "ABC" });

      expect(conciertoService.unirsePorCodigo).toHaveBeenCalledWith(YO, 3, "ABC");
      expect(mensaje.accion.conciertos[0]).toMatchObject({ unido: true, fans_unidos: 41 });
      expect(mensaje.accion.estado).toBe("hecha");
      expect(respuesta.contenido).toContain('ya estás en "Duki en River"');
    });

    it("sin código no intenta unirlo", async () => {
      await expect(chatbotService.resolverAccion(YO, 5, "confirmar", { idConcierto: 3 })).rejects.toMatchObject({ status: 400 });
      expect(conciertoService.unirsePorCodigo).not.toHaveBeenCalled();
    });

    it("con el código mal, la tarjeta vuelve a quedar como estaba", async () => {
      const { ApiError } = await import("../src/helpers/ApiError.js");
      conciertoService.unirsePorCodigo.mockRejectedValue(ApiError.badRequest("Código incorrecto"));

      await expect(chatbotService.resolverAccion(YO, 5, "confirmar", { idConcierto: 3, codigo: "mal" })).rejects.toMatchObject({
        message: "Código incorrecto",
      });
      expect(mensajeChatbotRepository.cambiarAccion).toHaveBeenLastCalledWith(5, "uniendo", ACCION);
    });
  });
});
