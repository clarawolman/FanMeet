import { z } from "zod";

// Token que devuelve Last.fm cuando la persona aprueba FanMeet (32
// caracteres; puede traer "_" y "-", ej. "wZcvoxhEFIjZuRvmQcLPkVq_YgwO7tcn").
// El nombre de usuario ya no se escribe a mano: se lo pregunta el backend
// a Last.fm con este token.
export const vincularLastfmSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{16,64}$/, "No pudimos confirmar tu cuenta de Last.fm. Volvé a intentarlo."),
});

// Origen del frontend que abre el popup (a donde vuelve Last.fm).
export const autorizarLastfmSchema = z.object({
  origen: z.string().trim().url(),
});
