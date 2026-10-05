import { describe, it, expect } from "vitest";
import { calcularEdad } from "../src/entities/Usuario.js";

const HOY = new Date(2026, 9, 5); // 5 de octubre de 2026

describe("calcularEdad", () => {
  it("cuenta los años si ya cumplió este año", () => {
    expect(calcularEdad("2004-03-21", HOY)).toBe(22);
  });

  it("resta uno si todavía no cumplió este año", () => {
    expect(calcularEdad("2004-12-01", HOY)).toBe(21);
  });

  it("el día del cumpleaños ya cuenta", () => {
    expect(calcularEdad("2004-10-05", HOY)).toBe(22);
  });

  it("devuelve null sin fecha o con fecha inválida", () => {
    expect(calcularEdad(null, HOY)).toBeNull();
    expect(calcularEdad("cualquier cosa", HOY)).toBeNull();
  });
});
