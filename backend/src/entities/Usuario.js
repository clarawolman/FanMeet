import { FOTO_PERFIL_DEFAULT } from "../helpers/constants.js";

// Forma completa: la misma fila de "usuario", tal como hoy la guarda
// App.jsx en el estado usuarioActual/usuarioVisitado.
export function toUsuarioCompleto(row) {
  if (!row) return null;
  return {
    id_usuario: row.id_usuario,
    nombre: row.nombre,
    mail: row.mail,
    fechanac: row.fechanac,
    genero: row.genero,
    fotoperfil: row.fotoperfil || row.foto_perfil || FOTO_PERFIL_DEFAULT,
    estilo_asistencia: row.estilo_asistencia,
  };
}

// Forma reducida usada al armar listas (fans de un concierto, participantes
// de un grupo, amigos): misma forma que arma hoy App.jsx/MisGrupos.jsx.
export function toUsuarioResumen(row) {
  if (!row) return null;
  return {
    id_usuario: row.id_usuario,
    nombre: row.nombre || "Usuario",
    foto_perfil: row.fotoperfil || row.foto_perfil || FOTO_PERFIL_DEFAULT,
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
    fotoperfil: row.fotoperfil || row.foto_perfil || FOTO_PERFIL_DEFAULT,
    estilo_asistencia: row.estilo_asistencia,
  };
}
