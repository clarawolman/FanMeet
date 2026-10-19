import { describe, it, expect } from "vitest";
import { crearConciertoSchema, actualizarConciertoSchema, actualizarGrupoSchema } from "../src/validators/backofficeValidators.js";
import { hoyEnArgentina } from "../src/helpers/fechas.js";

const CONCIERTO = {
  nombre: "Show",
  artista: "Duki",
  id_estadio: 1,
  id_estiloMusical: 1,
  imagenConcierto: "https://ejemplo.com/foto.jpg",
};

describe("crearConciertoSchema: fecha", () => {
  it("rechaza una fecha anterior a hoy", () => {
    const resultado = crearConciertoSchema.safeParse({ ...CONCIERTO, fecha: "2020-01-01T21:00" });
    expect(resultado.success).toBe(false);
    expect(resultado.error.issues[0].message).toMatch(/ya pasó/);
  });

  it("acepta hoy aunque la hora ya haya pasado", () => {
    const resultado = crearConciertoSchema.safeParse({ ...CONCIERTO, fecha: `${hoyEnArgentina()}T00:01` });
    expect(resultado.success).toBe(true);
  });

  it("acepta una fecha futura", () => {
    const resultado = crearConciertoSchema.safeParse({ ...CONCIERTO, fecha: "2099-12-31T21:00" });
    expect(resultado.success).toBe(true);
  });
});

describe("actualizarConciertoSchema: fecha", () => {
  it("rechaza cambiar la fecha a un día pasado", () => {
    expect(actualizarConciertoSchema.safeParse({ fecha: "2020-01-01T21:00" }).success).toBe(false);
  });

  it("deja editar otros campos sin mandar la fecha", () => {
    expect(actualizarConciertoSchema.safeParse({ nombre: "Otro nombre" }).success).toBe(true);
  });
});

describe("actualizarGrupoSchema", () => {
  it("acepta cambiar un solo campo", () => {
    const resultado = actualizarGrupoSchema.safeParse({ hora: "19:30" });
    expect(resultado.success).toBe(true);
    expect(resultado.data).toEqual({ hora: "19:30" });
  });

  it("rechaza si no mandan ningún cambio", () => {
    expect(actualizarGrupoSchema.safeParse({}).success).toBe(false);
  });

  it("acepta foto vacía para sacarla", () => {
    expect(actualizarGrupoSchema.safeParse({ foto: "" }).success).toBe(true);
  });

  it("rechaza una ubicación demasiado corta", () => {
    expect(actualizarGrupoSchema.safeParse({ ubicacion: "bar" }).success).toBe(false);
  });
});

describe("cupoSchema", async () => {
  const { cupoSchema } = await import("../src/validators/grupoValidators.js");

  it("vacío o null es sin límite", () => {
    expect(cupoSchema.parse("")).toBeNull();
    expect(cupoSchema.parse(null)).toBeNull();
  });

  it("acepta el número como texto (input de formulario)", () => {
    expect(cupoSchema.parse("8")).toBe(8);
  });

  it("rechaza menos de 2, decimales y más de 500", () => {
    expect(cupoSchema.safeParse(1).success).toBe(false);
    expect(cupoSchema.safeParse(2.5).success).toBe(false);
    expect(cupoSchema.safeParse(501).success).toBe(false);
  });
});
