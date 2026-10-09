import { describe, it, expect } from "vitest";
import { contieneMalasPalabras } from "../src/helpers/filtroPalabras.js";

describe("contieneMalasPalabras", () => {
  it.each(["sos un PUUUTO", "p.u.t.o", "H1J0 DE PUTA", "que mierdas", "forros", "te voy a matar"])(
    "bloquea '%s'",
    (texto) => {
      expect(contieneMalasPalabras(texto)).toBe(true);
    }
  );

  it.each(["hola che boludo", "computadora", "disputa", "matemos el tiempo", "la Concha acústica", ""])(
    "deja pasar '%s'",
    (texto) => {
      expect(contieneMalasPalabras(texto)).toBe(false);
    }
  );
});
