import { z } from "zod";

export const marcarLeidasSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1, "Mandá al menos un id de notificación"),
});

export const idNotificacionParamSchema = z.object({
  idNotificacion: z.coerce.number().int().positive("id de notificación inválido"),
});
