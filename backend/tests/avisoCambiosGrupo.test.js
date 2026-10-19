import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/grupoRepository.js", () => ({
  grupoUsuarioRepository: { listarUsuariosPorGrupo: vi.fn() },
}));
vi.mock("../src/repositories/notificacionRepository.js", () => ({
  notificacionRepository: { crearVarias: vi.fn() },
}));

const { grupoUsuarioRepository } = await import("../src/repositories/grupoRepository.js");
const { notificacionRepository } = await import("../src/repositories/notificacionRepository.js");
const { avisarCambiosDeGrupo, camposCambiados, textoDelAviso } = await import(
  "../src/services/avisoCambiosGrupo.js"
);

const ANTES = {
  id_grupo: 7,
  id_concierto: 9,
  nombre: "Previa metalera",
  categoria: "pre",
  fecha: "2026-10-20",
  hora: "18:00:00",
  ubicacion: "Parque de los Patricios",
  descripcion: "",
  foto: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  grupoUsuarioRepository.listarUsuariosPorGrupo.mockResolvedValue([
    { id_usuario: "creador" },
    { id_usuario: "fan1" },
    { id_usuario: "fan2" },
  ]);
});

describe("camposCambiados", () => {
  it("no cuenta como cambio la hora con o sin segundos", () => {
    expect(camposCambiados(ANTES, { ...ANTES, hora: "18:00" })).toEqual([]);
  });

  it("ignora la foto", () => {
    expect(camposCambiados(ANTES, { ...ANTES, foto: "data:image/png;base64,xx" })).toEqual([]);
  });
});

describe("textoDelAviso", () => {
  it("cuenta qué cambió y los datos nuevos del encuentro", () => {
    const despues = { ...ANTES, hora: "19:30", ubicacion: "Bar La Esquina" };
    expect(textoDelAviso(["hora", "ubicacion"], despues)).toBe(
      "Cambió la hora y el punto de encuentro del grupo. Ahora: 20/10 a las 19:30 en Bar La Esquina."
    );
  });

  it("si cambió el tipo dice cuál es ahora", () => {
    expect(textoDelAviso(["categoria"], { ...ANTES, categoria: "after" })).toBe(
      "Cambió el tipo del grupo. Ahora es after."
    );
  });
});

describe("avisarCambiosDeGrupo", () => {
  it("avisa a los integrantes menos a quien hizo el cambio", async () => {
    const notificados = await avisarCambiosDeGrupo(ANTES, { ...ANTES, hora: "19:00" }, { excepto: "creador" });

    expect(notificados).toBe(2);
    const filas = notificacionRepository.crearVarias.mock.calls[0][0];
    expect(filas.map((f) => f.id_usuario)).toEqual(["fan1", "fan2"]);
    expect(filas[0]).toMatchObject({ tipo: "cambio_grupo", id_grupo: 7, id_concierto: 9, titulo: "Previa metalera" });
  });

  it("si no cambió nada no avisa", async () => {
    expect(await avisarCambiosDeGrupo(ANTES, { ...ANTES })).toBe(0);
    expect(notificacionRepository.crearVarias).not.toHaveBeenCalled();
  });

  it("si falla el aviso no rompe el cambio", async () => {
    notificacionRepository.crearVarias.mockRejectedValue(new Error("constraint"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await avisarCambiosDeGrupo(ANTES, { ...ANTES, nombre: "Otra" })).toBe(0);
  });
});
