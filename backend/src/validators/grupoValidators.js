import { z } from "zod";

export const CUPO_MINIMO = 2;
export const CUPO_MAXIMO = 500;

// null (o vacío, desde un formulario) = sin límite. El creador cuenta como
// un lugar, por eso el mínimo es 2.
export const cupoSchema = z.preprocess(
  (valor) => (valor === "" || valor === null || valor === undefined ? null : Number(valor)),
  z
    .number({ invalid_type_error: "El cupo tiene que ser un número" })
    .int("El cupo tiene que ser un número entero")
    .min(CUPO_MINIMO, `El cupo mínimo es ${CUPO_MINIMO} (vos contás como uno)`)
    .max(CUPO_MAXIMO, `El cupo máximo es ${CUPO_MAXIMO}`)
    .nullable()
);

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
  cupo: cupoSchema.optional(),
});

// El creador edita su grupo: solo los campos que cambiaron. El concierto no
// se puede cambiar (los integrantes se sumaron para ese show).
export const actualizarGrupoSchema = crearGrupoSchema
  .omit({ id_concierto: true })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "No mandaste ningún cambio" });

export const idGrupoParamSchema = z.object({
  idGrupo: z.coerce.number().int().positive("id de grupo inválido"),
});
