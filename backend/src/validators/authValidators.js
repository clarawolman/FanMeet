import { z } from "zod";

// Mismas reglas que hoy valida Registro1.jsx en el cliente (mayuscula,
// minuscula, numero, caracter especial, minimo 8), repetidas en el
// servidor porque nunca hay que confiar solo en la validacion de React.
const contrasenaSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
  .regex(/[a-z]/, "Debe incluir al menos una minúscula")
  .regex(/[0-9]/, "Debe incluir al menos un número")
  .regex(/[^A-Za-z0-9]/, "Debe incluir al menos un carácter especial");

export const loginSchema = z.object({
  usuarioOMail: z.string().trim().min(1, "Ingresá tu usuario o mail"),
  contrasena: z.string().min(1, "Ingresá tu contraseña"),
});

export const verificarDisponibilidadSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  mail: z.string().trim().email("Mail inválido"),
});

export const registroSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  mail: z.string().trim().email("Mail inválido"),
  contrasena: contrasenaSchema,
  fechanac: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  genero: z.string().trim().min(1, "El género es obligatorio"),
  estilo_asistencia: z.enum(["pogo", "tranquilo", "campo"]),
  estilos_musicales: z
    .array(z.union([z.string(), z.number()]))
    .min(2, "Elegí al menos 2 géneros musicales"),
  previewFoto: z.string().optional(),
});
