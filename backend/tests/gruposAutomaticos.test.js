import { describe, it, expect } from "vitest";
import { armarGruposAutomaticos, fechaConDesplazamiento } from "../src/helpers/gruposAutomaticos.js";

const AHORA = new Date("2026-11-02T12:00:00Z");

const concierto = (extra = {}) => ({
  id_concierto: 10,
  nombre: "Tour 2026",
  fecha: "2026-12-05T21:00:00",
  artista: { nombre: "Fifty Something" },
  estadio: { nombre: "River Plate", direccion: "Av. Figueroa Alcorta 7597" },
  ...extra,
});

const PLANTILLAS = [
  { nombre: "Previa de {artista}", categoria: "pre", minutos: -180, ubicacion: "Puerta del {estadio}", descripcion: "" },
  { nombre: "Estacionamiento {estadio}", categoria: "mismo_dia", minutos: -240, ubicacion: "Estacionamiento de {direccion}", descripcion: "" },
  { nombre: "After de {artista}", categoria: "after", minutos: 180, ubicacion: "Salida del {estadio}", descripcion: "" },
];

describe("fechaConDesplazamiento", () => {
  it("resta horas sin correr la zona horaria", () => {
    expect(fechaConDesplazamiento("2026-12-05T21:00:00", -180)).toEqual({ fecha: "2026-12-05", hora: "18:00" });
  });

  it("pasa al día siguiente si el after es después de medianoche", () => {
    expect(fechaConDesplazamiento("2026-12-05T22:30:00", 120)).toEqual({ fecha: "2026-12-06", hora: "00:30" });
  });

  it("devuelve null sin fecha", () => {
    expect(fechaConDesplazamiento(null, 60)).toBeNull();
  });
});

describe("armarGruposAutomaticos", () => {
  it("arma un grupo por plantilla con las variables reemplazadas", () => {
    const filas = armarGruposAutomaticos({ conciertos: [concierto()], plantillas: PLANTILLAS, gruposExistentes: [], ahora: AHORA });
    expect(filas.map((f) => [f.nombre, f.categoria, f.fecha, f.hora, f.ubicacion])).toEqual([
      ["Previa de Fifty Something", "pre", "2026-12-05", "18:00", "Puerta del River Plate"],
      ["Estacionamiento River Plate", "mismo_dia", "2026-12-05", "17:00", "Estacionamiento de Av. Figueroa Alcorta 7597"],
      ["After de Fifty Something", "after", "2026-12-06", "00:00", "Salida del River Plate"],
    ]);
    expect(filas.every((f) => !f.existe && !f.error)).toBe(true);
  });

  it("marca los que ya existen (mismo nombre en el mismo concierto, sin importar tildes)", () => {
    const filas = armarGruposAutomaticos({
      conciertos: [concierto()],
      plantillas: PLANTILLAS,
      gruposExistentes: [{ nombre: "previa de fifty something", id_concierto: 10 }],
      ahora: AHORA,
    });
    expect(filas.map((f) => f.existe)).toEqual([true, false, false]);
  });

  it("saltea los conciertos que ya pasaron y respeta los ids elegidos", () => {
    const conciertos = [
      concierto({ id_concierto: 1, fecha: "2026-10-01T21:00:00" }),
      concierto({ id_concierto: 2 }),
      concierto({ id_concierto: 3 }),
    ];
    const todos = armarGruposAutomaticos({ conciertos, plantillas: PLANTILLAS.slice(0, 1), gruposExistentes: [], ahora: AHORA });
    expect(todos.map((f) => f.concierto.id_concierto)).toEqual([2, 3]);

    const elegidos = armarGruposAutomaticos({
      conciertos,
      plantillas: PLANTILLAS.slice(0, 1),
      gruposExistentes: [],
      idsConciertos: [3],
      ahora: AHORA,
    });
    expect(elegidos.map((f) => f.concierto.id_concierto)).toEqual([3]);
  });

  it("marca error si el punto de encuentro queda muy corto", () => {
    const filas = armarGruposAutomaticos({
      conciertos: [concierto({ estadio: null })],
      plantillas: [{ ...PLANTILLAS[0], ubicacion: "{estadio}" }],
      gruposExistentes: [],
      ahora: AHORA,
    });
    expect(filas[0].error).toMatch(/muy corto/);
  });
});

describe("compararPorConcierto", async () => {
  const { compararPorConcierto } = await import("../src/services/backofficeService.js");
  const ahora = new Date("2026-11-02T12:00:00Z");
  const g = (id_grupo, id_concierto, fechaConcierto, fecha = null, hora = null) => ({
    id_grupo, id_concierto, fechaConcierto, fecha, hora, nombre: `G${id_grupo}`,
  });

  it("próximos primero (por fecha), después los pasados (más recientes primero), y dentro por encuentro", () => {
    const grupos = [
      g(1, 30, "2026-09-01T21:00:00"),
      g(2, 20, "2027-01-10T21:00:00", "2027-01-10", "18:00"),
      g(3, 10, "2026-12-05T21:00:00", "2026-12-06", "00:00"),
      g(4, 10, "2026-12-05T21:00:00", "2026-12-05", "18:00"),
      g(5, 40, "2026-10-15T21:00:00"),
      g(6, 10, "2026-12-05T21:00:00"),
    ];
    const orden = [...grupos].sort((a, b) => compararPorConcierto(a, b, ahora)).map((x) => x.id_grupo);
    expect(orden).toEqual([6, 4, 3, 2, 5, 1]);
  });
});
