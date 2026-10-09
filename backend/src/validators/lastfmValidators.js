import { z } from "zod";

// Regla de Last.fm para nombres de usuario: 2 a 15 caracteres, empieza con
// letra y despues letras, numeros, "_" o "-".
export const vincularLastfmSchema = z.object({
  usuario_lastfm: z
    .string()
    .trim()
    .regex(/^[A-Za-z][A-Za-z0-9_-]{1,14}$/, "Ese no parece un usuario de Last.fm válido"),
});

export const escuchasQuerySchema = z.object({
  periodo: z.enum(["semana", "mes", "trimestre", "semestre", "anio", "siempre"]).default("mes"),
});
