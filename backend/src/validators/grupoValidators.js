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

// "comunidad" es un grupo sin encuentro (ver helpers/gruposGenerales.js).
export const CATEGORIAS_GRUPO = ["pre", "after", "mismo_dia", "comunidad"];

// Fechas de un grupo general (ids de concierto). El service controla que
// sean fechas seguidas del mismo artista y estadio.
export const idsConciertosSchema = z.array(z.coerce.number().int().positive()).max(30).optional();

// Un grupo de comunidad no tiene encuentro: fecha, hora y lugar quedan en
// null. Cualquier otro tipo necesita los tres.
export function conEncuentro(schema, mensajes) {
  return schema
    .superRefine((d, ctx) => {
      if (d.categoria === "comunidad") return;
      for (const campo of ["fecha", "hora", "ubicacion"]) {
        if (!d[campo]) ctx.addIssue({ code: "custom", path: [campo], message: mensajes[campo] });
      }
    })
    .transform((d) => (d.categoria === "comunidad" ? { ...d, fecha: null, hora: null, ubicacion: null } : d));
}

// Mismas reglas que hoy valida FormCrearGrupo.jsx/CrearGrupo.jsx en el cliente.
const camposGrupo = z.object({
  nombre: z.string().trim().min(1, "El nombre del grupo es obligatorio"),
  ubicacion: z.string().trim().min(6, "La ubicación debe tener al menos 6 caracteres").or(z.literal("")).nullish(),
  fecha: z.string().nullish(),
  hora: z.string().nullish(),
  descripcion: z.string().trim().optional().default(""),
  categoria: z.enum(CATEGORIAS_GRUPO),
  id_concierto: z.coerce.number().int().positive(),
  ids_conciertos: idsConciertosSchema,
  foto: z.string().optional(),
  cupo: cupoSchema.optional(),
});

export const crearGrupoSchema = conEncuentro(camposGrupo, {
  fecha: "La fecha es obligatoria",
  hora: "La hora es obligatoria",
  ubicacion: "La ubicación es obligatoria",
});

// El creador edita su grupo: solo los campos que cambiaron. El concierto no
// se puede cambiar (los integrantes se sumaron para ese show). Que el
// encuentro quede completo lo controla el service (cambiosConEncuentro).
export const actualizarGrupoSchema = camposGrupo
  .omit({ id_concierto: true, ids_conciertos: true })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "No mandaste ningún cambio" });

export const idGrupoParamSchema = z.object({
  idGrupo: z.coerce.number().int().positive("id de grupo inválido"),
});
