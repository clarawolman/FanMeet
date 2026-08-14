import { z } from "zod";

export const crearAmistadSchema = z.object({
  id_receptor: z.string().uuid("id de usuario receptor inválido"),
});

export const idAmistadParamSchema = z.object({
  idAmistad: z.coerce.number().int().positive("id de amistad inválido"),
});
