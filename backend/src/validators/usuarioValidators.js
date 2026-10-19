import { z } from "zod";

export const vibraSchema = z.object({
  estilo_asistencia: z.enum(["pogo", "tranquilo", "campo"]),
});

// Misma regla que EditarGeneros.jsx: minimo 2 generos seleccionados.
// Nombre / apodo opcional del perfil. Vacío = sin apodo (se muestra el @).
export const apodoSchema = z.object({
  apodo: z.string().trim().max(30, "El nombre puede tener hasta 30 caracteres"),
});

// @nombre: el que se usa para iniciar sesión y en el buscador.
export const REGEX_NOMBRE_USUARIO = /^[a-zA-Z0-9._]{3,30}$/;

// "Editar perfil": cada campo es opcional, solo se cambia lo que viene.
export const perfilSchema = z.object({
  apodo: apodoSchema.shape.apodo.optional(),
  descripcion: z
    .string()
    .trim()
    .max(160, "La descripción puede tener hasta 160 caracteres")
    .optional(),
  nombre: z
    .string()
    .trim()
    .regex(
      REGEX_NOMBRE_USUARIO,
      "El nombre de usuario tiene que tener de 3 a 30 letras, números, puntos o guiones bajos"
    )
    .optional(),
});

// highlight.id_highlight puede ser numérico o uuid según cómo se creó la tabla
export const idHighlightParamSchema = z.object({
  idHighlight: z.string().regex(/^(\d+|[0-9a-fA-F-]{36})$/, "id de momento inválido"),
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
