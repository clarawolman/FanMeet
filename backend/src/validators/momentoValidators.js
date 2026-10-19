import { z } from "zod";

// highlight.id_highlight puede ser numérico o uuid según cómo se creó la tabla
const idMomento = z.string().regex(/^(\d+|[0-9a-fA-F-]{36})$/, "id de momento inválido");

export const idMomentoParamSchema = z.object({ idHighlight: idMomento });

export const idComentarioParamSchema = z.object({
  idHighlight: idMomento,
  idComentario: z.coerce.number().int().positive("id de comentario inválido"),
});

const descripcion = z.string().trim().max(2200, "El pie de foto puede tener hasta 2200 caracteres");
const idConcierto = z.coerce.number().int().positive("Concierto inválido").nullable();

// En el multipart todo llega como texto: '["uuid"]', "true", "12"
const json = (schema) =>
  z.preprocess((valor) => {
    if (typeof valor !== "string") return valor;
    try {
      return JSON.parse(valor);
    } catch {
      return valor;
    }
  }, schema);

export const subirMomentoSchema = z.object({
  descripcion: descripcion.optional().default(""),
  id_concierto: z.preprocess((v) => (v === "" || v === "null" ? null : v), idConcierto).optional().default(null),
  etiquetados: json(
    z.array(z.string().uuid("id de usuario inválido")).max(10, "Podés etiquetar hasta 10 personas")
  ).optional().default([]),
  comentarios_activados: json(z.boolean()).optional().default(true),
  ocultar_likes: json(z.boolean()).optional().default(false),
});

export const editarMomentoSchema = z.object({
  descripcion: descripcion.optional(),
  id_concierto: idConcierto.optional(),
  comentarios_activados: z.boolean().optional(),
  ocultar_likes: z.boolean().optional(),
});

export const comentarioSchema = z.object({
  texto: z.string().trim().min(1, "Escribí un comentario").max(500, "El comentario puede tener hasta 500 caracteres"),
  id_respuesta_a: z.coerce.number().int().positive().nullable().optional(),
});
