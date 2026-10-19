import { bloqueoRepository } from "../repositories/bloqueoRepository.js";
import { amistadRepository } from "../repositories/amistadRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { notificacionRepository } from "../repositories/notificacionRepository.js";
import { toUsuarioResumen } from "../entities/Usuario.js";
import { ApiError } from "../helpers/ApiError.js";

// Notificaciones de uno sobre el otro que dejan de tener sentido.
const TIPOS_A_BORRAR = ["solicitud_amistad", "amistad_aceptada", "mensaje_privado"];

// Mismo mensaje que un usuario inexistente o suspendido: el bloqueado no
// tiene por qué enterarse de que lo bloquearon.
export const USUARIO_NO_DISPONIBLE = "El usuario no existe";

// Para los services que arman listas de otros usuarios: saca a todos con
// los que hay un bloqueo, en cualquier sentido.
export async function sinBloqueados(idUsuario, filas, campo = "id_usuario") {
  const bloqueados = await bloqueoRepository.idsConBloqueo(idUsuario);
  if (bloqueados.size === 0) return filas;
  return filas.filter((f) => !bloqueados.has(f[campo]));
}

// Corta cualquier acción entre dos usuarios con un bloqueo de por medio.
export async function exigirSinBloqueo(idUsuarioA, idUsuarioB) {
  if (idUsuarioA === idUsuarioB) return;
  if (await bloqueoRepository.existeEntre(idUsuarioA, idUsuarioB)) {
    throw ApiError.notFound(USUARIO_NO_DISPONIBLE);
  }
}

export const bloqueoService = {
  // Bloquear: se borra la amistad (o la solicitud pendiente) y las
  // notificaciones entre los dos. Los grupos que comparten no cambian.
  async bloquear(idUsuarioAutenticado, idBloqueado) {
    if (idUsuarioAutenticado === idBloqueado) {
      throw ApiError.badRequest("No podés bloquearte a vos mismo");
    }
    const usuario = await usuarioRepository.obtenerPorId(idBloqueado);
    if (!usuario) throw ApiError.notFound(USUARIO_NO_DISPONIBLE);

    await bloqueoRepository.crear(idUsuarioAutenticado, idBloqueado);

    const amistad = await amistadRepository.buscarEntreUsuarios(idUsuarioAutenticado, idBloqueado);
    await Promise.all([
      amistad ? amistadRepository.eliminar(amistad.id_amistad) : null,
      notificacionRepository.eliminarEntreUsuarios(idUsuarioAutenticado, idBloqueado, TIPOS_A_BORRAR),
    ]);
    return { ok: true };
  },

  // Solo quien bloqueó puede desbloquear. La amistad no vuelve.
  async desbloquear(idUsuarioAutenticado, idBloqueado) {
    await bloqueoRepository.eliminar(idUsuarioAutenticado, idBloqueado);
    return { ok: true };
  },

  // Los que bloqueé, para poder desbloquearlos desde Configuración.
  async listarBloqueados(idUsuarioAutenticado) {
    const filas = await bloqueoRepository.listarBloqueadosPor(idUsuarioAutenticado);
    if (filas.length === 0) return [];
    const usuarios = await usuarioRepository.listarPorIds(filas.map((f) => f.id_bloqueado));
    const porId = new Map(usuarios.map((u) => [u.id_usuario, u]));
    return filas
      .filter((f) => porId.has(f.id_bloqueado))
      .map((f) => ({ ...toUsuarioResumen(porId.get(f.id_bloqueado)), bloqueado_at: f.created_at }));
  },
};
