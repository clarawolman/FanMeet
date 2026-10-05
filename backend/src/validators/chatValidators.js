import { z } from "zod";

export { listarMensajesQuerySchema as listarMensajesPrivadosQuerySchema } from "./mensajeValidators.js";

// El texto es opcional porque un mensaje puede ser solo una foto (llega
// como multipart, campo "imagen"); chatService exige que haya al menos
// una de las dos cosas. Mismo límite de 2000 caracteres que la columna.
export const enviarMensajePrivadoSchema = z.object({
  contenido: z
    .string()
    .trim()
    .max(2000, "El mensaje no puede superar los 2000 caracteres")
    .optional()
    .default(""),
});
