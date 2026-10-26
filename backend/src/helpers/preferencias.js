import { normalizarGenero } from "./generos.js";

// Preferencias de Configuración (columna usuario.preferencias, ver
// supabase/configuracion.sql). Lo que no está guardado toma estos valores,
// así una cuenta vieja (o una base sin la columna) se comporta como siempre.
export const PREFERENCIAS_DEFAULT = {
  // Privacidad
  perfil_privado: false, // los momentos los ven solo los amigos
  mensajes: "amigos", // "amigos" | "nadie"
  etiquetas: "amigos", // "amigos" | "nadie"
  mostrar_conciertos: true,
  aparecer_en_descubrir: true,
  mostrar_musica: true, // lo que escucha en Last.fm
  ocultar_likes: false, // valor inicial al publicar un momento

  // Notificaciones por tipo
  notificaciones: {
    amistad: true,
    mensajes: true,
    momentos: true,
    grupos: true,
    conciertos: true,
  },
  // Días antes del show en que llega el recordatorio (0 = el mismo día)
  recordatorio_dias: [0],

  fani: true,
};

export const DIAS_RECORDATORIO = [0, 1, 7];

// Qué tipos de notificación apaga cada interruptor. La invitación a un
// momento (momento_etiquetado) siempre llega: sin ella no se puede aceptar.
export const TIPOS_POR_INTERRUPTOR = {
  amistad: ["solicitud_amistad", "amistad_aceptada"],
  mensajes: ["mensaje_privado", "mensaje_grupo"],
  momentos: ["momento_like", "momento_comentario"],
  grupos: ["grupo_unido", "cambio_grupo"],
  conciertos: ["concierto_unido", "novedad_concierto"],
};

export function preferenciasDe(usuario) {
  const guardadas = usuario?.preferencias || {};
  return {
    ...PREFERENCIAS_DEFAULT,
    ...guardadas,
    notificaciones: { ...PREFERENCIAS_DEFAULT.notificaciones, ...guardadas.notificaciones },
  };
}

// Tipos de notificación que la persona apagó
export function tiposSilenciados(usuario) {
  const { notificaciones } = preferenciasDe(usuario);
  return Object.entries(TIPOS_POR_INTERRUPTOR)
    .filter(([interruptor]) => notificaciones[interruptor] === false)
    .flatMap(([, tipos]) => tipos);
}

// "Córdoba " y "cordoba" son la misma ciudad
export function mismaCiudad(a, b) {
  if (!a || !b) return false;
  return normalizarGenero(a) === normalizarGenero(b);
}
