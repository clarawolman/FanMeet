import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.LASTFM_API_KEY = "lastfm-key-test";

vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: { listarTodos: vi.fn() },
}));
vi.mock("../src/repositories/artistaFavoritoRepository.js", () => ({
  artistaFavoritoRepository: { listarTodos: vi.fn() },
}));
vi.mock("../src/repositories/estiloMusicalRepository.js", () => ({
  estiloMusicalRepository: { listarCatalogo: vi.fn(), listarTodasLasSelecciones: vi.fn() },
}));
vi.mock("../src/repositories/lastfmRepository.js", () => ({
  lastfmCuentaRepository: { listarTodas: vi.fn() },
  lastfmApiRepository: {
    obtenerTopArtistas: vi.fn(),
    obtenerTagsArtista: vi.fn(),
    obtenerSimilares: vi.fn(),
  },
}));
vi.mock("../src/repositories/conciertoRepository.js", () => ({
  conciertoRepository: { listarTodos: vi.fn() },
  usuariosConciertosRepository: { listarTodas: vi.fn() },
}));
vi.mock("../src/repositories/amistadRepository.js", () => ({
  amistadRepository: { listarAceptadasDeUsuario: vi.fn() },
}));
vi.mock("../src/services/generoService.js", () => ({
  generoService: { vocabulario: vi.fn() },
}));

const { usuarioRepository } = await import("../src/repositories/usuarioRepository.js");
const { artistaFavoritoRepository } = await import("../src/repositories/artistaFavoritoRepository.js");
const { estiloMusicalRepository } = await import("../src/repositories/estiloMusicalRepository.js");
const { lastfmCuentaRepository, lastfmApiRepository } = await import(
  "../src/repositories/lastfmRepository.js"
);
const { conciertoRepository, usuariosConciertosRepository } = await import(
  "../src/repositories/conciertoRepository.js"
);
const { amistadRepository } = await import("../src/repositories/amistadRepository.js");
const { generoService } = await import("../src/services/generoService.js");
const { matchingService, compararPerfiles, coseno, limpiarCacheLastfm } = await import(
  "../src/services/matchingService.js"
);
const { ApiError } = await import("../src/helpers/ApiError.js");

const YO = "11111111-1111-1111-1111-111111111111";
const GEMELO = "22222222-2222-2222-2222-222222222222";
const OPUESTO = "33333333-3333-3333-3333-333333333333";
const VACIO = "44444444-4444-4444-4444-444444444444";

function perfil({ artistas = {}, similares = {}, generos = {}, conciertos = [], vibra = null }) {
  return {
    artistas: new Map(
      Object.entries(artistas).map(([clave, peso]) => [clave, { nombre: clave, peso, favorito: true }])
    ),
    similares: new Map(
      Object.entries(similares).map(([clave, [peso, origen]]) => [clave, { nombre: clave, peso, origen }])
    ),
    generos: new Map(Object.entries(generos)),
    generosElegidos: new Set(Object.keys(generos)),
    conciertos: new Set(conciertos),
    vibra,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  limpiarCacheLastfm();
  usuarioRepository.listarTodos.mockResolvedValue([
    { id_usuario: YO, nombre: "yo", estilo_asistencia: "pogo" },
    { id_usuario: GEMELO, nombre: "gemelo", estilo_asistencia: "pogo" },
    { id_usuario: OPUESTO, nombre: "opuesto", estilo_asistencia: "tranquilo" },
    { id_usuario: VACIO, nombre: "vacio" },
  ]);
  estiloMusicalRepository.listarCatalogo.mockResolvedValue([
    { id: 1, nombre: "pop" },
    { id: 2, nombre: "rock" },
    { id: 3, nombre: "trap" },
  ]);
  estiloMusicalRepository.listarTodasLasSelecciones.mockResolvedValue([
    { id_usuario: YO, id_estilo: 3 },
    { id_usuario: YO, id_estilo: 2 },
    { id_usuario: GEMELO, id_estilo: 3 },
    { id_usuario: OPUESTO, id_estilo: 1 },
  ]);
  artistaFavoritoRepository.listarTodos.mockResolvedValue([
    { id_usuario: YO, nombre: "Duki" },
    { id_usuario: GEMELO, nombre: "Duki" },
    { id_usuario: OPUESTO, nombre: "Taylor Swift" },
  ]);
  lastfmCuentaRepository.listarTodas.mockResolvedValue([]);
  usuariosConciertosRepository.listarTodas.mockResolvedValue([]);
  generoService.vocabulario.mockResolvedValue(
    new Map([
      ["pop", "pop"],
      ["rock", "rock"],
      ["trap", "trap"],
      ["latin trap", "latin trap"],
    ])
  );
  lastfmApiRepository.obtenerTagsArtista.mockResolvedValue({ toptags: { tag: [] } });
  lastfmApiRepository.obtenerSimilares.mockResolvedValue({ similarartists: { artist: [] } });
});

describe("coseno", () => {
  it("da 1 con vectores iguales y 0 sin nada en común", () => {
    const a = new Map([["x", 1], ["y", 2]]);
    expect(coseno(a, new Map(a))).toBeCloseTo(1);
    expect(coseno(a, new Map([["z", 1]]))).toBe(0);
  });
});

describe("compararPerfiles", () => {
  it("sin datos de alguno de los dos no inventa un porcentaje", () => {
    const resultado = compararPerfiles(perfil({ artistas: { duki: 1 } }), perfil({}));
    expect(resultado.porcentaje).toBeNull();
  });

  it("más gustos en común dan más compatibilidad", () => {
    const yo = perfil({ artistas: { duki: 1, khea: 0.8 }, generos: { trap: 1 } });
    const parecido = perfil({ artistas: { duki: 1, khea: 0.6 }, generos: { trap: 1 } });
    const distinto = perfil({ artistas: { "taylor swift": 1 }, generos: { pop: 1 } });

    const conParecido = compararPerfiles(yo, parecido);
    const conDistinto = compararPerfiles(yo, distinto);

    expect(conParecido.porcentaje).toBeGreaterThan(80);
    expect(conDistinto.porcentaje).toBe(0);
    expect(conParecido.artistasEnComun).toEqual(["duki", "khea"]);
  });

  it("cuenta artistas parecidos aunque no compartan ninguno", () => {
    const yo = perfil({ artistas: { duki: 1 }, similares: { "ysy a": [0.9, "Duki"] } });
    const otro = perfil({ artistas: { "ysy a": 1 }, similares: { duki: [0.9, "Ysy A"] } });

    const resultado = compararPerfiles(yo, otro);

    expect(resultado.porcentaje).toBeGreaterThan(0);
    expect(resultado.artistasEnComun).toEqual([]);
    expect(resultado.parecidos).toEqual([{ suyo: "ysy a", tuyo: "Duki" }]);
  });

  it("solo con géneros en común el porcentaje no llega a lo máximo", () => {
    const resultado = compararPerfiles(perfil({ generos: { pop: 1 } }), perfil({ generos: { pop: 1 } }));
    expect(resultado.porcentaje).toBeLessThan(80);
  });

  it("suma conciertos en común y misma vibra, y solo muestra géneros con nombre", () => {
    const yo = perfil({ generos: { trap: 1, raro: 1 }, conciertos: ["7"], vibra: "pogo" });
    const otro = perfil({ generos: { trap: 1, raro: 1 }, conciertos: ["7"], vibra: "pogo" });

    const resultado = compararPerfiles(yo, otro, new Map([["trap", "Trap"]]));

    expect(resultado.conciertosEnComun).toBe(1);
    expect(resultado.mismaVibra).toBe(true);
    expect(resultado.generosEnComun).toEqual(["Trap"]);
  });
});

describe("matchingService.descubrir", () => {
  it("ordena por compatibilidad y deja afuera a quien no tiene gustos cargados", async () => {
    const { perfilCompleto, fans } = await matchingService.descubrir(YO);

    expect(perfilCompleto).toBe(true);
    expect(fans.map((f) => f.id_usuario)).toEqual([GEMELO]);
    expect(fans[0].artistasEnComun).toEqual(["Duki"]);
    expect(fans[0]).not.toHaveProperty("mail");
  });

  it("avisa si el propio perfil no tiene gustos para comparar", async () => {
    const resultado = await matchingService.descubrir(VACIO);
    expect(resultado).toEqual({ perfilCompleto: false, fans: [] });
  });

  it("deduce géneros de los tags de Last.fm y descarta los que no son géneros", async () => {
    lastfmApiRepository.obtenerTagsArtista.mockResolvedValue({
      toptags: {
        tag: [
          { name: "Latin Trap", count: "100" },
          { name: "seen live", count: "90" },
          { name: "argentina", count: "80" },
        ],
      },
    });

    const { fans } = await matchingService.descubrir(YO);

    expect(fans[0].generosEnComun).toContain("latin trap");
    expect(fans[0].generosEnComun).not.toContain("seen live");
  });

  it("si Last.fm falla, sigue con lo que hay", async () => {
    lastfmApiRepository.obtenerTagsArtista.mockRejectedValue(new Error("caído"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { fans } = await matchingService.descubrir(YO);

    expect(fans.map((f) => f.id_usuario)).toEqual([GEMELO]);
  });
});

describe("matchingService.compatibilidad", () => {
  it("no deja compararse con uno mismo", async () => {
    await expect(matchingService.compatibilidad(YO, YO)).rejects.toBeInstanceOf(ApiError);
  });

  it("404 si el otro usuario no existe", async () => {
    await expect(
      matchingService.compatibilidad(YO, "99999999-9999-9999-9999-999999999999")
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("matchingService.recomendarConciertos", () => {
  beforeEach(() => {
    amistadRepository.listarAceptadasDeUsuario.mockResolvedValue([
      { id_solicitante: YO, id_receptor: GEMELO },
    ]);
    conciertoRepository.listarTodos.mockResolvedValue([
      { id_concierto: 1, nombre: "Duki en vivo", id_estiloMusical: 3, artista: { nombre: "Duki" } },
      { id_concierto: 2, nombre: "Eras", id_estiloMusical: 1, artista: { nombre: "Taylor Swift" } },
      { id_concierto: 3, nombre: "Ya voy", id_estiloMusical: 2, artista: { nombre: "Otro" } },
    ]);
    usuariosConciertosRepository.listarTodas.mockResolvedValue([
      { id_usuario: YO, id_concierto: 3 },
      { id_usuario: GEMELO, id_concierto: 2 },
    ]);
  });

  it("recomienda primero a sus artistas, saltea a los que ya se unió y explica por qué", async () => {
    const recomendados = await matchingService.recomendarConciertos(YO);

    expect(recomendados.map((c) => c.id_concierto)).toEqual([1, 2]);
    expect(recomendados[0].motivo).toBe("Duki está entre tus favoritos");
    expect(recomendados[1].motivo).toBe("Va 1 amigo tuyo");
  });

  it("sin gustos cargados no recomienda nada", async () => {
    expect(await matchingService.recomendarConciertos(VACIO)).toEqual([]);
  });
});
