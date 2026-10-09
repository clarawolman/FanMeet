import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.LASTFM_API_KEY = "lastfm-key-test";

vi.mock("../src/repositories/musicbrainzRepository.js", () => ({
  musicbrainzRepository: { listarGeneros: vi.fn() },
}));
vi.mock("../src/repositories/lastfmRepository.js", () => ({
  lastfmApiRepository: { obtenerInfoTag: vi.fn() },
}));
vi.mock("../src/repositories/estiloMusicalRepository.js", () => ({
  estiloMusicalRepository: { listarCatalogo: vi.fn(), crear: vi.fn() },
}));

const { musicbrainzRepository } = await import("../src/repositories/musicbrainzRepository.js");
const { lastfmApiRepository } = await import("../src/repositories/lastfmRepository.js");
const { estiloMusicalRepository } = await import("../src/repositories/estiloMusicalRepository.js");
const { generoService } = await import("../src/services/generoService.js");

beforeEach(() => {
  vi.clearAllMocks();
  musicbrainzRepository.listarGeneros.mockResolvedValue([
    "latin trap",
    "trap",
    "trap metal",
    "hip hop",
    "cumbia",
  ]);
  estiloMusicalRepository.listarCatalogo.mockResolvedValue([
    { id: 2, nombre: "rock" },
    { id: 3, nombre: "Trap" },
  ]);
  lastfmApiRepository.obtenerInfoTag.mockResolvedValue({ tag: { reach: 0 } });
  estiloMusicalRepository.crear.mockImplementation(async (nombre) => ({ id: 99, nombre }));
});

describe("generoService.buscar", () => {
  it("busca en MusicBrainz, exacto primero, y trae el id de los que ya están", async () => {
    const resultados = await generoService.buscar("trap");

    expect(resultados.map((g) => g.nombre)).toEqual(["Trap", "trap metal", "latin trap"]);
    expect(resultados[0].id).toBe(3);
    expect(resultados[1].id).toBeNull();
  });

  it("ignora guiones y mayúsculas", async () => {
    const resultados = await generoService.buscar("Hip-Hop");
    expect(resultados.map((g) => g.nombre)).toEqual(["hip hop"]);
  });

  it("si no está en MusicBrainz lo busca en Last.fm", async () => {
    lastfmApiRepository.obtenerInfoTag.mockResolvedValue({ tag: { reach: 2088 } });

    const resultados = await generoService.buscar("rock nacional");

    expect(resultados).toEqual([{ id: null, nombre: "rock nacional" }]);
  });

  it("no devuelve nada para texto inventado", async () => {
    expect(await generoService.buscar("asdkjhasd")).toEqual([]);
  });
});

describe("generoService.obtenerOCrear", () => {
  it("devuelve el existente sin duplicar", async () => {
    const genero = await generoService.obtenerOCrear("TRAP");
    expect(genero).toEqual({ id: 3, nombre: "Trap" });
    expect(estiloMusicalRepository.crear).not.toHaveBeenCalled();
  });

  it("crea con el nombre de MusicBrainz", async () => {
    await generoService.obtenerOCrear("Latin-Trap");
    expect(estiloMusicalRepository.crear).toHaveBeenCalledWith("latin trap");
  });

  it("crea los que solo existen en Last.fm", async () => {
    lastfmApiRepository.obtenerInfoTag.mockResolvedValue({ tag: { reach: 2054 } });
    await generoService.obtenerOCrear("Folklore");
    expect(estiloMusicalRepository.crear).toHaveBeenCalledWith("folklore");
  });

  it("rechaza tags populares que no son géneros y texto inventado", async () => {
    lastfmApiRepository.obtenerInfoTag.mockResolvedValue({ tag: { reach: 99999 } });
    await expect(generoService.obtenerOCrear("seen live")).rejects.toMatchObject({ status: 404 });

    lastfmApiRepository.obtenerInfoTag.mockResolvedValue({ tag: { reach: 0 } });
    await expect(generoService.obtenerOCrear("qwerty")).rejects.toMatchObject({ status: 404 });
    expect(estiloMusicalRepository.crear).not.toHaveBeenCalled();
  });
});
