import { z } from "zod";

// Mismo limite que el check de la columna "contenido" en
// supabase/mensajes_grupo.sql.
export const enviarMensajeSchema = z.object({
  contenido: z
    .string()
    .trim()
    .min(1, "El mensaje no puede estar vacío")
    .max(2000, "El mensaje no puede superar los 2000 caracteres"),
});

export const listarMensajesQuerySchema = z.object({
  antes_de: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().min(1).max(100).optional(),
});
