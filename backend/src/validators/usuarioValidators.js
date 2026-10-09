import { z } from "zod";

export const vibraSchema = z.object({
  estilo_asistencia: z.enum(["pogo", "tranquilo", "campo"]),
});

// Misma regla que EditarGeneros.jsx: minimo 2 generos seleccionados.
export const generosSchema = z.object({
  ids_estilos: z
    .array(z.union([z.string(), z.number()]))
    .min(2, "Elegí al menos 2 géneros musicales"),
});

export const buscarGeneroSchema = z.object({
  q: z.string().trim().min(1, "Escribí algo para buscar").max(60),
});

export const nombreGeneroSchema = z.object({
  nombre: z.string().trim().min(1, "Escribí un género").max(60),
});

export const idUsuarioParamSchema = z.object({
  idUsuario: z.string().uuid("id de usuario inválido"),
});
