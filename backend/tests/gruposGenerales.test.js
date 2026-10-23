import { describe, it, expect } from "vitest";
import { conciertosDelGrupo, esGrupoGeneral, fechasSeguidas } from "../src/helpers/gruposGenerales.js";
import { crearGrupoSchema } from "../src/validators/grupoValidators.js";

const fecha = (id, dia, extra = {}) => ({ id_concierto: id, id_artista: 1, id_estadio: 1, fecha: `${dia}T21:00:00`, ...extra });

describe("fechasSeguidas", () => {
  const conciertos = [
    fecha(3, "2099-11-15"),
    fecha(1, "2099-11-13"),
    fecha(2, "2099-11-14"),
    fecha(4, "2099-11-26"),
    fecha(5, "2099-11-27"),
    fecha(6, "2099-11-14", { id_estadio: 2 }),
    fecha(7, "2099-11-16", { id_artista: 9 }),
  ];

  it("junta las fechas del mismo artista y estadio con hasta 2 días entre una y otra", () => {
    expect(fechasSeguidas(conciertos[0], conciertos).map((c) => c.id_concierto)).toEqual([1, 2, 3]);
    expect(fechasSeguidas(conciertos[4], conciertos).map((c) => c.id_concierto)).toEqual([4, 5]);
  });

  it("un show suelto (u otro estadio) vuelve solo", () => {
    expect(fechasSeguidas(conciertos[5], conciertos).map((c) => c.id_concierto)).toEqual([6]);
  });
});

describe("conciertosDelGrupo", () => {
  it("un grupo común es de su concierto; uno general, de todas sus fechas", () => {
    expect(conciertosDelGrupo({ id_concierto: 1, ids_conciertos: null })).toEqual([1]);
    expect(conciertosDelGrupo({ id_concierto: 1, ids_conciertos: [1, 2, 3] })).toEqual([1, 2, 3]);
    expect(esGrupoGeneral({ id_concierto: 1, ids_conciertos: [1, 2] })).toBe(true);
    expect(esGrupoGeneral({ id_concierto: 1 })).toBe(false);
  });
});

describe("crearGrupoSchema", () => {
  const base = { nombre: "Fans de MB", id_concierto: 1, ids_conciertos: [1, 2, 3] };

  it("un grupo de comunidad no necesita encuentro y se guarda sin fecha, hora ni lugar", () => {
    const resultado = crearGrupoSchema.safeParse({ ...base, categoria: "comunidad", fecha: "2099-01-01", ubicacion: "" });
    expect(resultado.success).toBe(true);
    expect(resultado.data).toMatchObject({ fecha: null, hora: null, ubicacion: null, ids_conciertos: [1, 2, 3] });
  });

  it("cualquier otro tipo necesita fecha, hora y punto de encuentro", () => {
    const resultado = crearGrupoSchema.safeParse({ ...base, categoria: "pre" });
    expect(resultado.success).toBe(false);
    expect(resultado.error.issues.map((i) => i.path[0])).toEqual(["fecha", "hora", "ubicacion"]);
  });
});
