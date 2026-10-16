import { z } from "zod";

export const crearReporteSchema = z.object({
  idReportado: z.string().uuid("Usuario inválido"),
  idGrupo: z.coerce.number().int().positive().optional().nullable(),
  motivo: z
    .string()
    .trim()
    .min(5, "Contanos un poco más qué pasó (mínimo 5 caracteres)")
    .max(1000, "El motivo no puede superar los 1000 caracteres"),
});
