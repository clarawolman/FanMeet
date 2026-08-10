import { z } from "zod";

// Mismas reglas que hoy valida FormCrearGrupo.jsx/CrearGrupo.jsx en el cliente.
export const crearGrupoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del grupo es obligatorio"),
  ubicacion: z.string().trim().min(6, "La ubicación debe tener al menos 6 caracteres"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  hora: z.string().min(1, "La hora es obligatoria"),
  descripcion: z.string().trim().optional().default(""),
  categoria: z.enum(["pre", "after", "mismo_dia"]),
  id_concierto: z.coerce.number().int().positive(),
  foto: z.string().optional(),
});

export const idGrupoParamSchema = z.object({
  idGrupo: z.coerce.number().int().positive("id de grupo inválido"),
});
