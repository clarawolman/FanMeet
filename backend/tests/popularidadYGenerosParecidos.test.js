import { describe, it, expect } from "vitest";
import { puntajeDestacado } from "../src/services/popularidadArtistas.js";
import { parecidoDeGeneros } from "../src/services/matchingService.js";
import { registroSchema } from "../src/validators/authValidators.js";

describe("puntajeDestacado", () => {
  it("un artista enorme queda arriba aunque tenga pocos unidos", () => {
    const enorme = puntajeDestacado({ popularidad: 0.95, unidos: 2, maxUnidos: 300 });
    const chicoConMuchos = puntajeDestacado({ popularidad: 0.25, unidos: 300, maxUnidos: 300 });
    expect(enorme).toBeGreaterThan(chicoConMuchos);
  });

  it("a igual popularidad, gana el que tiene más unidos", () => {
    const a = puntajeDestacado({ popularidad: 0.5, unidos: 100, maxUnidos: 100 });
    const b = puntajeDestacado({ popularidad: 0.5, unidos: 10, maxUnidos: 100 });
    expect(a).toBeGreaterThan(b);
  });

  it("sin popularidad conocida ordena solo por unidos", () => {
    expect(puntajeDestacado({ popularidad: null, unidos: 0, maxUnidos: 0 })).toBe(0);
    expect(puntajeDestacado({ popularidad: null, unidos: 5, maxUnidos: 5 })).toBeCloseTo(0.4);
  });
});

describe("parecidoDeGeneros", () => {
  const vocabulario = new Map([
    ["rock", "Rock"],
    ["metal", "Metal"],
    ["trap", "Trap"],
    ["reggaeton", "Reggaeton"],
    ["jazz", "Jazz"],
  ]);

  it("misma familia (indie rock ~ hard rock) es muy parecido", () => {
    const { parecido, genero } = parecidoDeGeneros("hard rock", new Map([["indie rock", 1]]), vocabulario);
    expect(parecido).toBeGreaterThan(0.5);
    expect(genero).toBe("indie rock");
  });

  it("géneros del mismo palo (metal ~ rock, reggaeton ~ trap) son parecidos", () => {
    expect(parecidoDeGeneros("metal", new Map([["rock", 1]]), vocabulario).parecido).toBeGreaterThan(0);
    expect(parecidoDeGeneros("reggaeton", new Map([["trap", 1]]), vocabulario).parecido).toBeGreaterThan(0);
  });

  it("géneros que no tienen nada que ver dan 0", () => {
    expect(parecidoDeGeneros("jazz", new Map([["metal", 1]]), vocabulario).parecido).toBe(0);
  });
});

describe("registroSchema", () => {
  const base = {
    nombre: "ana",
    mail: "ana@mail.com",
    contrasena: "Clave123!",
    fechanac: "2000-01-01",
    genero: "Mujer",
    estilos_musicales: [1, 2],
  };

  it("la vibe de concierto es opcional", () => {
    expect(registroSchema.safeParse(base).success).toBe(true);
    expect(registroSchema.safeParse({ ...base, estilo_asistencia: null }).success).toBe(true);
    expect(registroSchema.safeParse({ ...base, estilo_asistencia: "pogo" }).success).toBe(true);
  });

  it("los géneros siguen siendo obligatorios (al menos 2)", () => {
    expect(registroSchema.safeParse({ ...base, estilos_musicales: [1] }).success).toBe(false);
  });
});
