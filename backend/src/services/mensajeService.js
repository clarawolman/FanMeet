import { mensajeRepository } from "../repositories/mensajeRepository.js";
import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { toMensaje } from "../entities/Mensaje.js";
import { ApiError } from "../helpers/ApiError.js";

async function exigirMiembro(idUsuarioAutenticado, idGrupo) {
  const grupo = await grupoRepository.obtenerPorId(idGrupo);
  if (!grupo) throw ApiError.notFound("El grupo no existe");

  const esMiembro = await grupoUsuarioRepository.existeRelacion(idUsuarioAutenticado, idGrupo);
  if (!esMiembro) throw ApiError.forbidden("No pertenecés a este grupo");

  return grupo;
}

async function armarUsuariosPorId(idsUsuario) {
  const idsUnicos = [...new Set(idsUsuario)];
  if (idsUnicos.length === 0) return new Map();
  const filas = await usuarioRepository.listarPorIds(idsUnicos);
  return new Map(filas.map((fila) => [fila.id_usuario, fila]));
}

export const mensajeService = {
  // El envio pasa por el backend (en vez de insertar directo con el cliente
  // de supabase del navegador) para que la verificacion de membresia viva
  // en un solo lugar. El trigger fn_notificar_mensaje_grupo (ver
  // supabase/mensajes_grupo.sql) corre igual sobre este insert y notifica al
  // resto del grupo, sin que este service tenga que llamar a
  // notificacionService.
  async enviar(idUsuarioAutenticado, idGrupo, contenido) {
    await exigirMiembro(idUsuarioAutenticado, idGrupo);

    const fila = await mensajeRepository.crear({
      idGrupo,
      idUsuario: idUsuarioAutenticado,
      contenido,
    });

    const usuario = await usuarioRepository.obtenerPorId(idUsuarioAutenticado);
    return toMensaje(fila, { usuario });
  },

  async listar(idUsuarioAutenticado, idGrupo, opciones) {
    await exigirMiembro(idUsuarioAutenticado, idGrupo);

    const filas = await mensajeRepository.listarPorGrupo(idGrupo, opciones);
    const usuariosPorId = await armarUsuariosPorId(filas.map((fila) => fila.id_usuario));

    return filas.map((fila) => toMensaje(fila, { usuario: usuariosPorId.get(fila.id_usuario) }));
  },
};
