import { z } from "zod";

export const vibraSchema = z.object({
  estilo_asistencia: z.enum(["pogo", "tranquilo", "campo"]),
});

// Misma regla que EditarGeneros.jsx: minimo 2 generos seleccionados.
// Nombre / apodo opcional del perfil. Vacío = sin apodo (se muestra el @).
export const apodoSchema = z.object({
  apodo: z.string().trim().max(30, "El nombre puede tener hasta 30 caracteres"),
});

export const generosSchema = z.object({
  ids_estilos: z
    .array(z.union([z.string(), z.number()]))
    .min(2, "Elegí al menos 2 géneros musicales"),
});

export const buscarGeneroSchema = z.object({
  q: z.string().trim().min(1, "Escribí algo para buscar").max(60),
});

export const buscarUsuarioSchema = z.object({
  q: z.string().trim().min(2, "Escribí al menos 2 letras").max(40),
});

export const nombreGeneroSchema = z.object({
  nombre: z.string().trim().min(1, "Escribí un género").max(60),
});

export const idUsuarioParamSchema = z.object({
  idUsuario: z.string().uuid("id de usuario inválido"),
});
