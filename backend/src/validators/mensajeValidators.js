import { z } from "zod";

// El texto es opcional porque un mensaje puede ser solo una foto (llega
// como multipart, campo "imagen"); mensajeService exige que haya al menos
// una de las dos cosas. Mismo límite que el check de la columna
// (supabase/fotos_chat_grupo.sql).
export const enviarMensajeSchema = z.object({
  contenido: z
    .string()
    .trim()
    .max(2000, "El mensaje no puede superar los 2000 caracteres")
    .optional()
    .default(""),
});

// Confirmar o cancelar una propuesta de Fani (ver chatbotService.resolverAccion).
export const idMensajeParamSchema = z.object({
  idMensaje: z.coerce.number().int().positive("id de mensaje inválido"),
});

export const resolverAccionSchema = z.object({
  decision: z.enum(["confirmar", "cancelar"]),
});

export const listarMensajesQuerySchema = z.object({
  antes_de: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().min(1).max(100).optional(),
});
