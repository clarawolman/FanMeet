import { z } from "zod";

export const bloquearSchema = z.object({
  id_usuario: z.string().uuid("id de usuario inválido"),
});
