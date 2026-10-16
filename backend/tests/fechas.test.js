import { describe, it, expect } from "vitest";
import { hoyEnArgentina, conciertoYaPaso } from "../src/helpers/fechas.js";

// 16/10/2026 a las 01:00 UTC = 15/10/2026 a las 22:00 en Argentina.
const AHORA = new Date("2026-10-16T01:00:00Z");

describe("helpers/fechas", () => {
  it("hoyEnArgentina usa la hora de Argentina, no la UTC", () => {
    expect(hoyEnArgentina(AHORA)).toBe("2026-10-15");
  });

  it("un concierto sigue vigente todo el día del show", () => {
    expect(conciertoYaPaso("2026-10-15T21:00:00", AHORA)).toBe(false);
    expect(conciertoYaPaso("2026-12-01T21:00:00", AHORA)).toBe(false);
  });

  it("pasa a 'ya pasó' desde el día siguiente", () => {
    expect(conciertoYaPaso("2026-10-14T21:00:00", AHORA)).toBe(true);
  });

  it("sin fecha no se considera pasado", () => {
    expect(conciertoYaPaso(null, AHORA)).toBe(false);
  });
});
