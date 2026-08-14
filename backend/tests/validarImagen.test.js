import { describe, it, expect } from "vitest";
import { esImagenValida } from "../src/helpers/validarImagen.js";

describe("esImagenValida", () => {
  it("acepta un buffer con la firma JPEG y mimetype image/jpeg", () => {
    const archivo = { mimetype: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]) };
    expect(esImagenValida(archivo)).toBe(true);
  });

  it("acepta un buffer con la firma PNG y mimetype image/png", () => {
    const archivo = {
      mimetype: "image/png",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    };
    expect(esImagenValida(archivo)).toBe(true);
  });

  it("acepta un buffer con la firma WEBP y mimetype image/webp", () => {
    const buffer = Buffer.alloc(12);
    buffer.write("RIFF", 0, "ascii");
    buffer.write("WEBP", 8, "ascii");
    expect(esImagenValida({ mimetype: "image/webp", buffer })).toBe(true);
  });

  it("rechaza un mimetype no soportado aunque el buffer sea válido", () => {
    const archivo = { mimetype: "image/gif", buffer: Buffer.from([0xff, 0xd8, 0xff]) };
    expect(esImagenValida(archivo)).toBe(false);
  });

  it("rechaza un mimetype declarado como imagen cuando el contenido real no lo es (SVG/HTML falseado)", () => {
    const archivo = { mimetype: "image/jpeg", buffer: Buffer.from("<svg onload=alert(1)>") };
    expect(esImagenValida(archivo)).toBe(false);
  });

  it("rechaza un buffer vacío", () => {
    expect(esImagenValida({ mimetype: "image/jpeg", buffer: Buffer.alloc(0) })).toBe(false);
  });
});
