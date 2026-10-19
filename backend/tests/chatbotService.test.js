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
  mensajeChatbotRepository: { crear: vi.fn(), listarDeUsuario: vi.fn() },
}));

vi.mock("../src/repositories/conciertoRepository.js", () => ({
  conciertoRepository: { listarTodos: vi.fn() },
  usuariosConciertosRepository: { listarConciertosPorUsuario: vi.fn() },
}));

vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoRepository: { listarPorConcierto: vi.fn() },
  grupoUsuarioRepository: { listarGruposPorUsuario: vi.fn(), listarUsuariosPorGrupos: vi.fn() },
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

const { mensajeChatbotRepository } = await import("../src/repositories/mensajeChatbotRepository.js");
const { conciertoRepository, usuariosConciertosRepository } = await import(
  "../src/repositories/conciertoRepository.js"
);
const { grupoRepository, grupoUsuarioRepository } = await import("../src/repositories/grupoRepository.js");
const { estiloMusicalRepository } = await import("../src/repositories/estiloMusicalRepository.js");
const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { artistaFavoritoRepository } = await import("../src/repositories/artistaFavoritoRepository.js");
const { usuarioService } = await import("../src/services/usuarioService.js");
const { chatbotService } = await import("../src/services/chatbotService.js");

const YO = "yo-uuid";

beforeEach(() => {
  vi.clearAllMocks();
  fetchFalso.mockReset().mockImplementation(respuestaOk);

  let siguienteId = 1;
  mensajeChatbotRepository.crear.mockImplementation(async ({ idUsuario, rol, contenido }) => ({
    id_mensaje: siguienteId++,
    id_usuario: idUsuario,
    rol,
    contenido,
    created_at: "2026-10-09T12:00:00Z",
  }));
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
