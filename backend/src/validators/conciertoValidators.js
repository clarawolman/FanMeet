import { z } from "zod";

export const idConciertoParamSchema = z.object({
  idConcierto: z.coerce.number().int().positive("id de concierto inválido"),
});

export const unirseConciertoSchema = z.object({
  codigo: z.string().trim().min(1, "Ingresá el código de acceso"),
});
