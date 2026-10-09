import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.LASTFM_API_KEY = "lastfm-key-test";

vi.mock("../src/repositories/lastfmRepository.js", () => ({
  lastfmCuentaRepository: { obtenerPorUsuario: vi.fn() },
  lastfmApiRepository: { obtenerTopArtistas: vi.fn(), obtenerInfoUsuario: vi.fn() },
}));
vi.mock("../src/services/spotifyService.js", () => ({
  spotifyService: { buscarImagen: vi.fn(), buscarArtistaPorNombre: vi.fn() },
}));
vi.mock("../src/services/matchingService.js", () => ({
  generosPrincipales: vi.fn(),
}));
vi.mock("../src/repositories/artistaFavoritoRepository.js", () => ({
  artistaFavoritoRepository: { listarPorUsuario: vi.fn() },
}));
vi.mock("../src/repositories/estiloMusicalRepository.js", () => ({
  estiloMusicalRepository: { listarCatalogo: vi.fn(), listarIdsPorUsuario: vi.fn() },
}));

const { lastfmCuentaRepository, lastfmApiRepository } = await import(
  "../src/repositories/lastfmRepository.js"
);
const { spotifyService } = await import("../src/services/spotifyService.js");
const { generosPrincipales } = await import("../src/services/matchingService.js");
const { artistaFavoritoRepository } = await import("../src/repositories/artistaFavoritoRepository.js");
const { estiloMusicalRepository } = await import("../src/repositories/estiloMusicalRepository.js");
const { lastfmService } = await import("../src/services/lastfmService.js");

const YO = "11111111-1111-1111-1111-111111111111";

function top(...nombres) {
  return { topartists: { artist: nombres.map((name) => ({ name, playcount: "10", image: [] })) } };
}

beforeEach(() => {
  vi.clearAllMocks();
  lastfmService.limpiarCache(YO);
  lastfmCuentaRepository.obtenerPorUsuario.mockResolvedValue({ usuario_lastfm: "fan" });
  lastfmApiRepository.obtenerInfoUsuario.mockResolvedValue({ user: { playcount: "5000" } });
  generosPrincipales.mockResolvedValue(["trap", "rock"]);
  spotifyService.buscarImagen.mockResolvedValue("img");
});

describe("lastfmService.obtenerResumen", () => {
  it("sin Last.fm vinculado no muestra nada", async () => {
    lastfmCuentaRepository.obtenerPorUsuario.mockResolvedValue(null);
    expect(await lastfmService.obtenerResumen(YO)).toEqual({ conectado: false });
  });

  it("arma el resumen del mes con su artista top, géneros y total", async () => {
    lastfmApiRepository.obtenerTopArtistas.mockResolvedValue(top("Duki", "Khea", "Trueno", "Bizarrap"));

    const resumen = await lastfmService.obtenerResumen(YO);

    expect(resumen).toMatchObject({
      conectado: true,
      periodo: "mes",
      total_reproducciones: 5000,
      artistaTop: { nombre: "Duki", imagen: "img" },
      otrosArtistas: ["Khea", "Trueno", "Bizarrap"],
      generos: ["trap", "rock"],
    });
  });

  it("si este mes no escuchó nada usa lo de siempre", async () => {
    lastfmApiRepository.obtenerTopArtistas
      .mockResolvedValueOnce(top())
      .mockResolvedValueOnce(top("Soda Stereo"));

    const resumen = await lastfmService.obtenerResumen(YO);

    expect(resumen.periodo).toBe("siempre");
    expect(resumen.artistaTop.nombre).toBe("Soda Stereo");
  });
});

describe("lastfmService.obtenerSugerencias", () => {
  beforeEach(() => {
    lastfmApiRepository.obtenerTopArtistas.mockResolvedValue(top("Duki", "Khea", "Nadie"));
    artistaFavoritoRepository.listarPorUsuario.mockResolvedValue([
      { nombre: "duki", spotify_id: "id-duki" },
    ]);
    spotifyService.buscarArtistaPorNombre.mockImplementation(async (nombre) =>
      nombre === "Nadie" ? null : { spotify_id: `id-${nombre.toLowerCase()}`, nombre }
    );
    estiloMusicalRepository.listarCatalogo.mockResolvedValue([
      { id: 2, nombre: "rock" },
      { id: 7, nombre: "Trap" },
    ]);
    estiloMusicalRepository.listarIdsPorUsuario.mockResolvedValue([{ id_estilo: 2 }]);
  });

  it("sugiere lo que no tiene, con id de Spotify, y saltea lo que ya eligió", async () => {
    const { artistas, generos } = await lastfmService.obtenerSugerencias(YO);

    expect(artistas).toEqual([{ spotify_id: "id-khea", nombre: "Khea" }]);
    expect(generos).toEqual([{ id: 7, nombre: "Trap" }]);
  });

  it("sin Last.fm vinculado no sugiere nada", async () => {
    lastfmCuentaRepository.obtenerPorUsuario.mockResolvedValue(null);
    expect(await lastfmService.obtenerSugerencias(YO)).toEqual({ artistas: [], generos: [] });
  });
});
