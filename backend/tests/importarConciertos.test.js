import { describe, it, expect } from "vitest";
import { leerFilas, leerFechaHora, esUrlHttp, claveConcierto } from "../src/helpers/importarConciertos.js";

const IMAGEN = "https://media.timeout.com/images/106457247/750/422/image.jpg";

describe("leerFilas", () => {
  it("lee una tabla Markdown con encabezado e ignora el resto del archivo", () => {
    const texto = [
      "# Conciertos",
      "Texto suelto que no es parte de la tabla.",
      "| # | Nombre | Artista | Estadio | Género | Fecha y hora | Imagen |",
      "|---|---|---|---|---|---|---|",
      `| 1 | Fifty Something | Rush | Movistar Arena | rock | 15/01/2027 21:00 | ${IMAGEN} |`,
      `| 2 | No Me Hablen De Amor | Ha*Ash | Movistar Arena | pop | 17/03/2027 21:00 | ${IMAGEN} |`,
    ].join("\n");

    const filas = leerFilas(texto);

    expect(filas).toHaveLength(2);
    expect(filas[0]).toMatchObject({
      fila: 1,
      nombre: "Fifty Something",
      artista: "Rush",
      estadio: "Movistar Arena",
      genero: "rock",
      fecha: "15/01/2027 21:00",
      imagen: IMAGEN,
    });
    expect(filas[1].artista).toBe("Ha*Ash");
  });

  it("lee una tabla copiada de una planilla (tabs), sin encabezado, en el orden del formulario", () => {
    const texto = `Take Cover Tour\tFoo Fighters\tRiver Plate\trock\t25/02/2027 21:00\t${IMAGEN}\r\n`;

    expect(leerFilas(texto)).toEqual([
      {
        fila: 1,
        nombre: "Take Cover Tour",
        artista: "Foo Fighters",
        estadio: "River Plate",
        genero: "rock",
        fecha: "25/02/2027 21:00",
        hora: "",
        imagen: IMAGEN,
      },
    ]);
  });

  it("lee un CSV con comillas y encabezados en otro orden, con la hora aparte", () => {
    const texto = [
      "artista,nombre,fecha,hora,estadio,genero,imagen",
      `Epica,"25 aniversario, con Rhapsody",2027-03-07,21:00,Estadio Malvinas Argentinas,metal,${IMAGEN}`,
    ].join("\n");

    const [fila] = leerFilas(texto);

    expect(fila).toMatchObject({
      nombre: "25 aniversario, con Rhapsody",
      artista: "Epica",
      fecha: "2027-03-07",
      hora: "21:00",
      estadio: "Estadio Malvinas Argentinas",
    });
  });

  it("usa ; como separador cuando la primera línea tiene más ; que ,", () => {
    const [fila] = leerFilas(`Así Soy Yo;Cuarteto de Nos;Movistar Arena;rock;22/05/2027 21:00;${IMAGEN}`);
    expect(fila.artista).toBe("Cuarteto de Nos");
  });

  it("devuelve [] si no hay nada", () => {
    expect(leerFilas("  \n \n")).toEqual([]);
  });
});

describe("leerFechaHora", () => {
  it("acepta dd/mm/aaaa y aaaa-mm-dd, con o sin T", () => {
    expect(leerFechaHora("15/01/2027 21:00")).toBe("2027-01-15T21:00");
    expect(leerFechaHora("5/2/2027 9:30")).toBe("2027-02-05T09:30");
    expect(leerFechaHora("2027-01-15T21:00")).toBe("2027-01-15T21:00");
    expect(leerFechaHora("2027-01-15", "21:00 hs")).toBe("2027-01-15T21:00");
  });

  it("avisa si falta la hora", () => {
    expect(leerFechaHora("15/01/2027")).toEqual({ sinHora: true });
  });

  it("rechaza fechas y horas que no existen", () => {
    expect(leerFechaHora("31/02/2027 21:00")).toBeNull();
    expect(leerFechaHora("15/01/2027 25:00")).toBeNull();
    expect(leerFechaHora("el sábado")).toBeNull();
  });
});

describe("esUrlHttp y claveConcierto", () => {
  it("solo acepta URLs http(s)", () => {
    expect(esUrlHttp(IMAGEN)).toBe(true);
    expect(esUrlHttp("imagen.jpg")).toBe(false);
    expect(esUrlHttp("javascript:alert(1)")).toBe(false);
  });

  it("compara el nombre sin mayúsculas ni tildes y solo el día", () => {
    expect(claveConcierto("Así Soy Yo", "2027-05-22T21:00")).toBe(claveConcierto("ASI SOY YO", "2027-05-22T23:00:00"));
  });
});
