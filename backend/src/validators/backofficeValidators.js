import { z } from "zod";

// "2026-08-28T21:00" (lo que manda un <input type="datetime-local">).
const fechaHora = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, "Fecha y hora inválidas");

const urlImagen = z.string().trim().url("La imagen tiene que ser una URL (https://...)");

export const idUsuarioParamSchema = z.object({
  idUsuario: z.string().uuid("id de usuario inválido"),
});

export const idReporteParamSchema = z.object({
  idReporte: z.coerce.number().int().positive("id de reporte inválido"),
});

export const idConciertoParamSchema = z.object({
  idConcierto: z.coerce.number().int().positive("id de concierto inválido"),
});

export const idGrupoParamSchema = z.object({
  idGrupo: z.coerce.number().int().positive("id de grupo inválido"),
});

export const listarUsuariosQuerySchema = z.object({
  busqueda: z.string().trim().max(100).optional(),
  estado: z.enum(["activo", "suspendido"]).optional(),
});

export const listarReportesQuerySchema = z.object({
  estado: z.enum(["pendiente", "sancionado", "descartado"]).optional(),
});

export const cambiarEstadoSchema = z
  .object({
    estado: z.enum(["activo", "suspendido"]),
    motivo: z.string().trim().max(1000).optional(),
  })
  .refine((d) => d.estado !== "suspendido" || Boolean(d.motivo), {
    message: "Escribí el motivo de la suspensión",
    path: ["motivo"],
  });

export const resolverReporteSchema = z.object({
  decision: z.enum(["sancionar", "descartar"]),
  resolucion: z.string().trim().max(1000).optional(),
});

const camposConcierto = {
  nombre: z.string().trim().min(1, "Poné el nombre del show").max(150),
  artista: z.string().trim().min(1, "Poné el artista").max(150),
  id_estadio: z.coerce.number().int().positive("Elegí un estadio"),
  id_estiloMusical: z.coerce.number().int().positive("Elegí un género"),
  fecha: fechaHora,
  imagenConcierto: urlImagen,
};

export const crearConciertoSchema = z.object(camposConcierto);

export const actualizarConciertoSchema = z
  .object(camposConcierto)
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "No mandaste ningún cambio" });

export const novedadSchema = z.object({
  titulo: z.string().trim().min(1, "Poné un título").max(100),
  descripcion: z.string().trim().min(1, "Escribí la novedad").max(500),
});
