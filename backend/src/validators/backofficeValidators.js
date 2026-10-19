import { z } from "zod";
import { conciertoYaPaso } from "../helpers/fechas.js";

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
  // Base62 de 22 caracteres. null = escrito a mano, sin vincular a Spotify.
  artista_spotify_id: z
    .string()
    .regex(/^[A-Za-z0-9]{22}$/, "id de Spotify inválido")
    .nullable()
    .optional(),
  id_estadio: z.coerce.number().int().positive("Elegí un estadio"),
  id_estiloMusical: z.coerce.number().int().positive("Elegí un género"),
  // Mismo criterio que esconde los conciertos pasados: hoy todavía vale.
  fecha: fechaHora.refine((fecha) => !conciertoYaPaso(fecha), "Esa fecha ya pasó: elegí hoy o un día futuro"),
  imagenConcierto: urlImagen,
};

export const crearConciertoSchema = z.object(camposConcierto);

export const actualizarConciertoSchema = z
  .object(camposConcierto)
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "No mandaste ningún cambio" });

// Mismos campos que crea un fan (grupoValidators.crearGrupoSchema), con la
// foto como URL opcional porque el backoffice no sube archivos.
export const crearGrupoSchema = z.object({
  nombre: z.string().trim().min(1, "Poné el nombre del grupo").max(100),
  ubicacion: z.string().trim().min(6, "La ubicación debe tener al menos 6 caracteres").max(150),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  hora: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora inválida"),
  descripcion: z.string().trim().max(500).optional().default(""),
  categoria: z.enum(["pre", "after", "mismo_dia"], { message: "Elegí un tipo de grupo" }),
  id_concierto: z.coerce.number().int().positive("Elegí un concierto"),
  foto: z.union([urlImagen, z.literal("")]).optional(),
});

// Solo los campos que cambiaron. Foto "" = sacarle la foto al grupo.
export const actualizarGrupoSchema = crearGrupoSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "No mandaste ningún cambio" });

export const novedadSchema = z.object({
  titulo: z.string().trim().min(1, "Poné un título").max(100),
  descripcion: z.string().trim().min(1, "Escribí la novedad").max(500),
});
