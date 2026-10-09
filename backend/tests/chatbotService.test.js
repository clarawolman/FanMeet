import { describe, it, expect, vi, beforeEach } from "vitest";

const crearMensaje = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {}
  class Anthropic {
    constructor() {
      this.beta = { messages: { create: crearMensaje } };
    }
  }
  Anthropic.APIError = APIError;
  Anthropic.AuthenticationError = class extends APIError {};
  Anthropic.RateLimitError = class extends APIError {};
  return { default: Anthropic };
});

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
  estiloMusicalRepository: { listarCatalogo: vi.fn() },
}));

const { mensajeChatbotRepository } = await import("../src/repositories/mensajeChatbotRepository.js");
const { conciertoRepository, usuariosConciertosRepository } = await import(
  "../src/repositories/conciertoRepository.js"
);
const { grupoRepository, grupoUsuarioRepository } = await import("../src/repositories/grupoRepository.js");
const { estiloMusicalRepository } = await import("../src/repositories/estiloMusicalRepository.js");
const { chatbotService } = await import("../src/services/chatbotService.js");

const YO = "yo-uuid";

beforeEach(() => {
  vi.clearAllMocks();

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

  crearMensaje.mockResolvedValue({
    stop_reason: "end_turn",
    content: [{ type: "text", text: "Hay una previa 🎸" }],
  });
});

function textoDelSystem() {
  return crearMensaje.mock.calls[0][0].system.map((b) => b.text).join("\n");
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
    crearMensaje.mockResolvedValue({ stop_reason: "refusal", content: [] });

    const { respuesta } = await chatbotService.enviar(YO, "algo raro");

    expect(respuesta.contenido).toContain("fanmeet100@gmail.com");
  });

  it("el historial que se manda arranca siempre con un mensaje del usuario", async () => {
    mensajeChatbotRepository.listarDeUsuario.mockResolvedValue([
      { id_mensaje: 1, id_usuario: YO, rol: "assistant", contenido: "respuesta vieja" },
      { id_mensaje: 2, id_usuario: YO, rol: "user", contenido: "nueva pregunta" },
    ]);

    await chatbotService.enviar(YO, "nueva pregunta");

    expect(crearMensaje.mock.calls[0][0].messages).toEqual([{ role: "user", content: "nueva pregunta" }]);
  });
});
