import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.SPOTIFY_CLIENT_ID = "client-id-test";
process.env.SPOTIFY_CLIENT_SECRET = "client-secret-test";

vi.mock("../src/repositories/spotifyApiRepository.js", () => ({
  spotifyApiRepository: {
    tokenDeApp: vi.fn(),
    buscar: vi.fn(),
    obtenerArtista: vi.fn(),
  },
}));

vi.mock("../src/repositories/artistaFavoritoRepository.js", () => ({
  artistaFavoritoRepository: {
    listarPorUsuario: vi.fn(),
    crear: vi.fn(),
    eliminar: vi.fn(),
  },
}));

const { spotifyApiRepository } = await import("../src/repositories/spotifyApiRepository.js");
const { artistaFavoritoRepository } = await import(
  "../src/repositories/artistaFavoritoRepository.js"
);
const { spotifyService } = await import("../src/services/spotifyService.js");

const YO = "11111111-1111-1111-1111-111111111111";
const ARTISTA_ID = "0OdUWJ0sBjDrqHygGUXeCF";

beforeEach(() => {
  vi.clearAllMocks();
  spotifyApiRepository.tokenDeApp.mockResolvedValue({ access_token: "app-token", expires_in: 3600 });
});

describe("spotifyService favoritos", () => {
  it("toma nombre e imagen de Spotify, no del cliente", async () => {
    artistaFavoritoRepository.listarPorUsuario.mockResolvedValue([]);
    spotifyApiRepository.obtenerArtista.mockResolvedValue({
      id: ARTISTA_ID,
      name: "Nombre real",
      images: [{ url: "img" }],
    });
    artistaFavoritoRepository.crear.mockImplementation(async (_id, artista) => artista);

    const favorito = await spotifyService.agregarFavorito(YO, ARTISTA_ID);

    expect(artistaFavoritoRepository.crear).toHaveBeenCalledWith(
      YO,
      expect.objectContaining({ spotify_id: ARTISTA_ID, nombre: "Nombre real", imagen: "img" })
    );
    expect(favorito.url).toBe(`https://open.spotify.com/artist/${ARTISTA_ID}`);
  });

  it("no duplica un artista que ya es favorito", async () => {
    artistaFavoritoRepository.listarPorUsuario.mockResolvedValue([
      { spotify_id: ARTISTA_ID, nombre: "Ya está", imagen: null },
    ]);

    const favorito = await spotifyService.agregarFavorito(YO, ARTISTA_ID);

    expect(favorito.nombre).toBe("Ya está");
    expect(artistaFavoritoRepository.crear).not.toHaveBeenCalled();
  });

  it("rechaza agregar más de 20 artistas", async () => {
    artistaFavoritoRepository.listarPorUsuario.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => ({ spotify_id: `id${i}` }))
    );
    await expect(spotifyService.agregarFavorito(YO, ARTISTA_ID)).rejects.toMatchObject({
      status: 400,
    });
    expect(spotifyApiRepository.obtenerArtista).not.toHaveBeenCalled();
  });
});

describe("spotifyService.buscar", () => {
  it("busca canciones en el catálogo con el token de la app", async () => {
    spotifyApiRepository.buscar.mockResolvedValue({
      tracks: { items: [{ id: "t1", name: "Tema", artists: [{ name: "A" }], album: { name: "Disco" } }] },
    });

    const resultados = await spotifyService.buscar("tema", "cancion");

    expect(spotifyApiRepository.buscar).toHaveBeenCalledWith("app-token", "tema", "track", 10);
    expect(resultados[0]).toMatchObject({ nombre: "Tema", album: "Disco" });
  });
});

describe("spotifyService.buscarImagen", () => {
  it("cachea la foto y no vuelve a consultar Spotify", async () => {
    spotifyApiRepository.buscar.mockResolvedValue({
      artists: { items: [{ id: ARTISTA_ID, name: "Banda", images: [{ url: "foto" }] }] },
    });

    expect(await spotifyService.buscarImagen("artista", "Banda Cache")).toBe("foto");
    expect(await spotifyService.buscarImagen("artista", "banda cache")).toBe("foto");
    expect(spotifyApiRepository.buscar).toHaveBeenCalledTimes(1);
  });

  it("devuelve null si Spotify falla, sin romper", async () => {
    spotifyApiRepository.buscar.mockRejectedValue(new Error("caído"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(spotifyService.buscarImagen("artista", "Otra banda")).resolves.toBeNull();
  });
});
