import { FOTO_PERFIL_DEFAULT } from "../helpers/constants.js";
import { preferenciasDe } from "../helpers/preferencias.js";

// Forma completa: la misma fila de "usuario", tal como hoy la guarda
// App.jsx en el estado usuarioActual/usuarioVisitado.
export function toUsuarioCompleto(row) {
  if (!row) return null;
  return {
    id_usuario: row.id_usuario,
    nombre: row.nombre,
    apodo: row.apodo || null,
    mail: row.mail,
    fechanac: row.fechanac,
    genero: row.genero,
    fotoperfil: row.fotoperfil || row.foto_perfil || FOTO_PERFIL_DEFAULT,
    // Para mostrar "Eliminar foto" solo si subió una propia
    tiene_foto: Boolean(row.fotoperfil || row.foto_perfil),
    estilo_asistencia: row.estilo_asistencia,
    rol: row.rol || "usuario",
    descripcion: row.descripcion || null,
    // Para "Editar perfil": cuándo cambió el @nombre por última vez
    nombre_cambiado_at: row.nombre_cambiado_at || null,
    // Configuración (solo la ve el dueño de la cuenta)
    ciudad: row.ciudad || null,
    preferencias: preferenciasDe(row),
  };
}

// Edad en años a partir de fechanac ("2004-03-21"). null si no hay fecha
// válida. Se expone la edad y no la fecha, que no se comparte con otros.
export function calcularEdad(fechanac, hoy = new Date()) {
  if (!fechanac) return null;
  const [anio, mes, dia] = String(fechanac).slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return null;

  let edad = hoy.getFullYear() - anio;
  const yaCumplio =
    hoy.getMonth() + 1 > mes || (hoy.getMonth() + 1 === mes && hoy.getDate() >= dia);
  if (!yaCumplio) edad -= 1;
  return edad >= 0 ? edad : null;
}

// Forma reducida usada al armar listas (fans de un concierto, participantes
// de un grupo, amigos): misma forma que arma hoy App.jsx/MisGrupos.jsx.
export function toUsuarioResumen(row) {
  if (!row) return null;
  return {
    id_usuario: row.id_usuario,
    nombre: row.nombre || "Usuario",
    apodo: row.apodo || null,
    foto_perfil: row.fotoperfil || row.foto_perfil || FOTO_PERFIL_DEFAULT,
    edad: calcularEdad(row.fechanac),
  };
}

// Forma para ver el perfil de OTRO usuario (perfil ajeno, lista de amigos):
// sin mail/fechanac/genero. Ningún componente del frontend lee esos campos
// salvo el propio dueño de la cuenta, así que no hace falta exponerlos acá.
export function toUsuarioPublico(row) {
  if (!row) return null;
  return {
    id_usuario: row.id_usuario,
    nombre: row.nombre,
    apodo: row.apodo || null,
    fotoperfil: row.fotoperfil || row.foto_perfil || FOTO_PERFIL_DEFAULT,
    estilo_asistencia: row.estilo_asistencia,
    descripcion: row.descripcion || null,
    ciudad: row.ciudad || null,
    // Para avisar en el perfil por qué no se ven los momentos
    perfil_privado: preferenciasDe(row).perfil_privado,
  };
}
