import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "node:crypto";

process.env.LASTFM_API_KEY = "clave-api";
process.env.LASTFM_SHARED_SECRET = "secreto";

vi.mock("../src/config/supabaseClient.js", () => ({ supabaseAdmin: {} }));

const { lastfmApiRepository } = await import("../src/repositories/lastfmRepository.js");

function respuesta(datos, ok = true) {
  return { ok, status: ok ? 200 : 400, json: async () => datos };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("lastfmApiRepository.obtenerSesion", () => {
  it("firma auth.getSession como pide Last.fm (md5 de params ordenados + secret, sin format)", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(respuesta({ session: { name: "RJ", key: "k" } }));

    await expect(lastfmApiRepository.obtenerSesion("tok123")).resolves.toEqual({
      session: { name: "RJ", key: "k" },
    });

    const url = new URL(fetchMock.mock.calls[0][0]);
    const esperado = createHash("md5")
      .update("api_keyclave-apimethodauth.getSessiontokentok123secreto")
      .digest("hex");
    expect(url.searchParams.get("method")).toBe("auth.getSession");
    expect(url.searchParams.get("token")).toBe("tok123");
    expect(url.searchParams.get("format")).toBe("json");
    expect(url.searchParams.get("api_sig")).toBe(esperado);
  });

  it("un token no aprobado o vencido es un 400 con mensaje para mostrar", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      respuesta({ error: 14, message: "Unauthorized Token" }, false)
    );

    await expect(lastfmApiRepository.obtenerSesion("tok")).rejects.toMatchObject({ status: 400 });
  });

  it("las lecturas públicas no se firman", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(respuesta({ user: { name: "RJ" } }));

    await lastfmApiRepository.obtenerInfoUsuario("rj");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.has("api_sig")).toBe(false);
  });
});

describe("lastfmApiRepository.urlAutorizacion", () => {
  it("arma la pantalla de aprobación de Last.fm con la api key y el callback", () => {
    const url = new URL(lastfmApiRepository.urlAutorizacion("http://localhost:5173/lastfm-callback.html"));

    expect(url.origin + url.pathname).toBe("https://www.last.fm/api/auth/");
    expect(url.searchParams.get("api_key")).toBe("clave-api");
    expect(url.searchParams.get("cb")).toBe("http://localhost:5173/lastfm-callback.html");
  });
});
