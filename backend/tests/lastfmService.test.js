import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.LASTFM_API_KEY = "lastfm-key-test";
process.env.LASTFM_SHARED_SECRET = "lastfm-secret-test";

vi.mock("../src/repositories/lastfmRepository.js", () => ({
  lastfmCuentaRepository: {
    obtenerPorUsuario: vi.fn(),
    guardar: vi.fn(),
    eliminar: vi.fn(),
  },
  lastfmApiRepository: {
    urlAutorizacion: vi.fn(),
    obtenerSesion: vi.fn(),
    obtenerInfoUsuario: vi.fn(),
    obtenerTopArtistas: vi.fn(),
    obtenerTopCanciones: vi.fn(),
    obtenerTopAlbumes: vi.fn(),
    obtenerRecientes: vi.fn(),
  },
}));

// Sin preferencias guardadas: lo que escucha se muestra (valor por defecto)
vi.mock("../src/repositories/usuarioRepository.js", () => ({
  usuarioRepository: { obtenerPorId: vi.fn(async () => null) },
}));

vi.mock("../src/services/spotifyService.js", () => ({
  spotifyService: { buscarImagen: vi.fn() },
}));

const { lastfmCuentaRepository, lastfmApiRepository } = await import(
  "../src/repositories/lastfmRepository.js"
);
const { spotifyService } = await import("../src/services/spotifyService.js");
const { lastfmService } = await import("../src/services/lastfmService.js");
const { ApiError } = await import("../src/helpers/ApiError.js");

const YO = "11111111-1111-1111-1111-111111111111";
const PLACEHOLDER =
  "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png";

function mockearRespuestasLastfm() {
  lastfmApiRepository.obtenerTopArtistas.mockResolvedValue({
    topartists: {
      artist: [{ name: "Banda", playcount: "120", url: "u1", image: [{ "#text": PLACEHOLDER }] }],
    },
  });
  // Un solo resultado: Last.fm lo manda como objeto, no como array.
  lastfmApiRepository.obtenerTopCanciones.mockResolvedValue({
    toptracks: {
      track: { name: "Tema", playcount: "40", url: "u2", artist: { name: "Banda" }, image: [] },
    },
  });
  lastfmApiRepository.obtenerTopAlbumes.mockResolvedValue({
    topalbums: {
      album: [
        { name: "Disco", playcount: "30", url: "u3", artist: { name: "Banda" }, image: [{ "#text": "tapa" }] },
      ],
    },
  });
  lastfmApiRepository.obtenerRecientes.mockResolvedValue({
    recenttracks: {
      "@attr": { total: "5000" },
      track: [
        {
          name: "Sonando",
          artist: { "#text": "Banda" },
          album: { "#text": "Disco" },
          image: [{ "#text": "tapa" }],
          "@attr": { nowplaying: "true" },
        },
        {
          name: "Antes",
          artist: { "#text": "Banda" },
          image: [{ "#text": "tapa2" }],
          date: { uts: "1790000000" },
        },
      ],
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("lastfmService.vincular", () => {
  it("guarda la cuenta que Last.fm confirma para ese token", async () => {
    lastfmApiRepository.obtenerSesion.mockResolvedValue({ session: { name: "RJ", key: "k" } });

    await expect(lastfmService.vincular(YO, "tok123")).resolves.toEqual({ usuario_lastfm: "RJ" });
    expect(lastfmApiRepository.obtenerSesion).toHaveBeenCalledWith("tok123");
    expect(lastfmCuentaRepository.guardar).toHaveBeenCalledWith(YO, "RJ");
  });

  it("no guarda nada si Last.fm no aprueba el token", async () => {
    lastfmApiRepository.obtenerSesion.mockRejectedValue(ApiError.badRequest("Token inválido"));

    await expect(lastfmService.vincular(YO, "vencido")).rejects.toMatchObject({ status: 400 });
    expect(lastfmCuentaRepository.guardar).not.toHaveBeenCalled();
  });

  it("no guarda nada si la sesión no trae usuario", async () => {
    lastfmApiRepository.obtenerSesion.mockResolvedValue({});

    await expect(lastfmService.vincular(YO, "tok123")).rejects.toMatchObject({ status: 400 });
    expect(lastfmCuentaRepository.guardar).not.toHaveBeenCalled();
  });
});

describe("lastfmService.urlAutorizacion", () => {
  it("manda a Last.fm con el callback del frontend que lo pidió", () => {
    lastfmApiRepository.urlAutorizacion.mockImplementation((cb) => `LASTFM?cb=${cb}`);

    expect(lastfmService.urlAutorizacion("http://localhost:5173")).toBe(
      "LASTFM?cb=http://localhost:5173/lastfm-callback.html"
    );
  });

  it("rechaza orígenes que no son el frontend (no es un redireccionador abierto)", () => {
    expect(() => lastfmService.urlAutorizacion("https://sitio-malo.com")).toThrow(
      expect.objectContaining({ status: 400 })
    );
    expect(lastfmApiRepository.urlAutorizacion).not.toHaveBeenCalled();
  });
});

describe("lastfmService.obtenerEscuchas", () => {
  it("devuelve conectado:false si no vinculó Last.fm", async () => {
    lastfmCuentaRepository.obtenerPorUsuario.mockResolvedValue(null);
    await expect(lastfmService.obtenerEscuchas(YO)).resolves.toEqual({ conectado: false });
  });

  it("arma tops y recientes, completando fotos faltantes con Spotify", async () => {
    const otro = "22222222-2222-2222-2222-222222222222";
    lastfmCuentaRepository.obtenerPorUsuario.mockResolvedValue({ usuario_lastfm: "fan" });
    spotifyService.buscarImagen.mockResolvedValue("foto-spotify");
    mockearRespuestasLastfm();

    const escuchas = await lastfmService.obtenerEscuchas(otro);

    expect(lastfmApiRepository.obtenerTopArtistas).toHaveBeenCalledWith("fan", "1month", 10);
    expect(escuchas.total_reproducciones).toBe(5000);
    expect(escuchas.topArtistas[0]).toMatchObject({
      nombre: "Banda",
      reproducciones: 120,
      imagen: "foto-spotify",
    });
    expect(escuchas.topCanciones).toHaveLength(1);
    expect(escuchas.topAlbumes[0]).toMatchObject({ nombre: "Disco", imagen: "tapa" });
    expect(escuchas.recientes[0]).toMatchObject({ sonando_ahora: true, escuchado_at: null });
    expect(escuchas.recientes[1].escuchado_at).toBe(new Date(1790000000 * 1000).toISOString());
    // Las que ya traen tapa de Last.fm no se buscan en Spotify.
    expect(spotifyService.buscarImagen).not.toHaveBeenCalledWith("cancion", "Sonando", "Banda");
  });

  it("cachea la respuesta para no consultar Last.fm en cada visita", async () => {
    const otro = "33333333-3333-3333-3333-333333333333";
    lastfmCuentaRepository.obtenerPorUsuario.mockResolvedValue({ usuario_lastfm: "fan" });
    spotifyService.buscarImagen.mockResolvedValue(null);
    mockearRespuestasLastfm();

    await lastfmService.obtenerEscuchas(otro, "mes");
    await lastfmService.obtenerEscuchas(otro, "mes");

    expect(lastfmApiRepository.obtenerTopArtistas).toHaveBeenCalledTimes(1);
  });
});
