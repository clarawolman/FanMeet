import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { storageRepository } from "../repositories/storageRepository.js";
import { usuariosConciertosRepository } from "../repositories/conciertoRepository.js";
import { grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { amistadRepository } from "../repositories/amistadRepository.js";
import { toUsuarioCompleto, toUsuarioPublico, toUsuarioResumen } from "../entities/Usuario.js";
import { ApiError } from "../helpers/ApiError.js";
import { sinBloqueados } from "./bloqueoService.js";
import { rutaArchivoUsuario } from "../helpers/sanitizeFilename.js";
import { esImagenValida } from "../helpers/validarImagen.js";
import { authRepository } from "../repositories/authRepository.js";
import { DIAS_RECORDATORIO, preferenciasDe } from "../helpers/preferencias.js";
import { enviarMail } from "../helpers/mailer.js";
import { env } from "../config/env.js";

// Las acciones delicadas de Configuración piden la contraseña actual.
async function exigirContrasena(idUsuario, contrasena) {
  const usuario = await usuarioRepository.obtenerPorId(idUsuario);
  if (!usuario) throw ApiError.notFound("Usuario no encontrado");
  const { error } = await authRepository.signInWithPassword(usuario.mail, contrasena);
  if (error) throw ApiError.badRequest("La contraseña no es correcta");
  return usuario;
}

export const DIAS_ENTRE_CAMBIOS_DE_NOMBRE = 15;
const DIA = 24 * 60 * 60 * 1000;

// Cuándo puede volver a cambiar su @nombre (null = ya puede)
export function proximoCambioDeNombre(nombreCambiadoAt, ahora = new Date()) {
  if (!nombreCambiadoAt) return null;
  const proximo = new Date(new Date(nombreCambiadoAt).getTime() + DIAS_ENTRE_CAMBIOS_DE_NOMBRE * DIA);
  return proximo > ahora ? proximo : null;
}

export const usuarioService = {
  // Uso exclusivo para el propio usuario autenticado (GET /usuarios/me):
  // incluye mail/fechanac/genero.
  async obtenerPerfil(idUsuario) {
    const usuario = await usuarioRepository.obtenerPorId(idUsuario);
    if (!usuario) throw ApiError.notFound("El usuario no existe");
    return toUsuarioCompleto(usuario);
  },

  // Uso para ver el perfil de OTRO usuario: nunca mail/fechanac/genero.
  // Un suspendido se ve como inexistente para el resto.
  async obtenerPerfilPublico(idUsuario) {
    const usuario = await usuarioRepository.obtenerPorId(idUsuario);
    if (!usuario || usuario.estado === "suspendido") throw ApiError.notFound("El usuario no existe");
    return toUsuarioPublico(usuario);
  },

  // Buscador de "Descubrir": forma resumida, sin mail ni fecha de nacimiento.
  // Sin los usuarios con los que hay un bloqueo.
  async buscar(idUsuarioAutenticado, texto) {
    const filas = await usuarioRepository.buscarActivos(texto, idUsuarioAutenticado);
    return (await sinBloqueados(idUsuarioAutenticado, filas)).map(toUsuarioResumen);
  },

  // idUsuarioAutenticado siempre sale de req.user.id (JWT), nunca de un
  // parametro de la request: asi se cierra el hallazgo de la auditoria
  // donde `perfil.jsx` confiaba en isOwnProfile (una prop de React) para
  // decidir si se podia escribir sobre ese id_usuario.
  async actualizarFoto(idUsuarioAutenticado, archivo) {
    if (!esImagenValida(archivo)) {
      throw ApiError.badRequest("El archivo debe ser una imagen válida (jpg, png o webp)");
    }

    const ruta = rutaArchivoUsuario(idUsuarioAutenticado, archivo.originalname);
    const url = await storageRepository.subirArchivo("avatars", ruta, archivo.buffer, archivo.mimetype);
    const usuario = await usuarioRepository.actualizar(idUsuarioAutenticado, { fotoperfil: url });
    return toUsuarioCompleto(usuario);
  },

  // Vuelve a la foto por defecto y borra la subida del bucket.
  async eliminarFoto(idUsuarioAutenticado) {
    const actual = await usuarioRepository.obtenerPorId(idUsuarioAutenticado);
    if (!actual) throw ApiError.notFound("Usuario no encontrado");

    const usuario = await usuarioRepository.actualizar(idUsuarioAutenticado, { fotoperfil: null });
    if (actual.fotoperfil) await storageRepository.eliminarPorUrl("avatars", actual.fotoperfil);
    return toUsuarioCompleto(usuario);
  },

  // ── Configuración ──────────────────────────────────────────────────────
  // Se guarda todo junto (lo que ya había + lo que cambió).
  async actualizarPreferencias(idUsuarioAutenticado, cambios) {
    const actual = await usuarioRepository.obtenerPorId(idUsuarioAutenticado);
    if (!actual) throw ApiError.notFound("Usuario no encontrado");

    const previas = preferenciasDe(actual);
    const preferencias = {
      ...previas,
      ...cambios,
      notificaciones: { ...previas.notificaciones, ...cambios.notificaciones },
    };
    if (cambios.recordatorio_dias) {
      preferencias.recordatorio_dias = DIAS_RECORDATORIO.filter((d) => cambios.recordatorio_dias.includes(d));
    }

    const usuario = await usuarioRepository.actualizar(idUsuarioAutenticado, { preferencias });
    return toUsuarioCompleto(usuario);
  },

  async actualizarCiudad(idUsuarioAutenticado, ciudad) {
    const usuario = await usuarioRepository.actualizar(idUsuarioAutenticado, { ciudad: ciudad || null });
    return toUsuarioCompleto(usuario);
  },

  async cambiarContrasena(idUsuarioAutenticado, { actual, nueva }) {
    const usuario = await exigirContrasena(idUsuarioAutenticado, actual);
    if (actual === nueva) throw ApiError.badRequest("La contraseña nueva tiene que ser distinta de la actual");

    const { error } = await authRepository.actualizarCuenta(usuario.id_usuario, { password: nueva });
    if (error) throw ApiError.badRequest("No se pudo cambiar la contraseña: " + error.message);
    return { ok: true };
  },

  // Queda confirmado al toque: ya se pidió la contraseña para cambiarlo.
  async cambiarMail(idUsuarioAutenticado, { mail, contrasena }) {
    const usuario = await exigirContrasena(idUsuarioAutenticado, contrasena);
    if (mail === String(usuario.mail).toLowerCase()) {
      throw ApiError.badRequest("Ese ya es tu mail");
    }
    if (await usuarioRepository.existeMail(mail)) {
      throw ApiError.badRequest("Ese mail ya tiene una cuenta");
    }

    const { error } = await authRepository.actualizarCuenta(usuario.id_usuario, { email: mail, email_confirm: true });
    if (error) throw ApiError.badRequest("No se pudo cambiar el mail: " + error.message);

    const actualizado = await usuarioRepository.actualizar(usuario.id_usuario, { mail });
    return toUsuarioCompleto(actualizado);
  },

  // Borra los datos (en una transacción), las fotos y la cuenta de Auth.
  async eliminarCuenta(idUsuarioAutenticado, contrasena) {
    const usuario = await exigirContrasena(idUsuarioAutenticado, contrasena);

    const fotosDeMomentos = await usuarioRepository.eliminarCuenta(usuario.id_usuario);
    await Promise.all([
      ...fotosDeMomentos.map((url) => storageRepository.eliminarPorUrl("highlights", url)),
      storageRepository.eliminarCarpeta("avatars", usuario.id_usuario).catch((e) =>
        console.error("No se pudieron borrar las fotos de perfil:", e)
      ),
    ]);

    const { error } = await authRepository.eliminarCuenta(usuario.id_usuario);
    if (error) console.error(`No se pudo borrar ${usuario.id_usuario} de Auth:`, error.message);
    return { ok: true };
  },

  // "Reportar un problema" / "Enviar una sugerencia": le llega al moderador.
  async enviarSugerencia(idUsuarioAutenticado, { tipo, texto }) {
    const usuario = await usuarioRepository.obtenerPorId(idUsuarioAutenticado);
    await enviarMail({
      para: env.mailModerador,
      asunto: `${tipo === "problema" ? "Problema" : "Sugerencia"} en FanMeet de ${usuario?.nombre || "un usuario"}`,
      texto: [`De: ${usuario?.nombre || "?"} (${usuario?.mail || "sin mail"})`, "", texto].join("\n"),
    });
    return { ok: true };
  },

  async actualizarVibra(idUsuarioAutenticado, estiloAsistencia) {
    const usuario = await usuarioRepository.actualizar(idUsuarioAutenticado, {
      estilo_asistencia: estiloAsistencia,
    });
    return toUsuarioCompleto(usuario);
  },

  // Vacío borra el apodo y el perfil vuelve a mostrar el nombre de usuario.
  async actualizarApodo(idUsuarioAutenticado, apodo) {
    const usuario = await usuarioRepository.actualizar(idUsuarioAutenticado, {
      apodo: apodo || null,
    });
    return toUsuarioCompleto(usuario);
  },

  // "Editar perfil": apodo, descripción y @nombre juntos. Solo se toca lo
  // que viene; el @nombre se puede cambiar una vez cada 15 días.
  async actualizarPerfil(idUsuarioAutenticado, { apodo, descripcion, nombre }) {
    const actual = await usuarioRepository.obtenerPorId(idUsuarioAutenticado);
    if (!actual) throw ApiError.notFound("El usuario no existe");

    const cambios = {};
    if (apodo !== undefined) cambios.apodo = apodo || null;
    if (descripcion !== undefined) cambios.descripcion = descripcion || null;

    if (nombre !== undefined && nombre !== actual.nombre) {
      const proximo = proximoCambioDeNombre(actual.nombre_cambiado_at);
      if (proximo) {
        const dias = Math.ceil((proximo.getTime() - Date.now()) / DIA);
        throw ApiError.badRequest(
          `Podés cambiar tu nombre de usuario una vez cada ${DIAS_ENTRE_CAMBIOS_DE_NOMBRE} días. ` +
            (dias === 1 ? "Te falta 1 día." : `Te faltan ${dias} días.`)
        );
      }

      const ocupado = await usuarioRepository.existeNombreSinMayusculas(nombre, idUsuarioAutenticado);
      if (ocupado) throw ApiError.badRequest("Ese nombre de usuario ya está en uso");

      cambios.nombre = nombre;
      cambios.nombre_cambiado_at = new Date().toISOString();
    }

    if (Object.keys(cambios).length === 0) return toUsuarioCompleto(actual);
    const usuario = await usuarioRepository.actualizar(idUsuarioAutenticado, cambios);
    return toUsuarioCompleto(usuario);
  },

  // Mismos 3 contadores que hoy calcula perfil.jsx::cargarEstadisticas.
  // Los amigos suspendidos no cuentan (tampoco aparecen en la lista), ni
  // los que tienen un bloqueo con quien mira (idQuienMira).
  async obtenerEstadisticas(idUsuario, idQuienMira = idUsuario) {
    const [conciertos, grupos, amistades] = await Promise.all([
      usuariosConciertosRepository.contarPorUsuario(idUsuario),
      grupoUsuarioRepository.contarPorUsuario(idUsuario),
      amistadRepository.listarAceptadasDeUsuario(idUsuario),
    ]);
    const idsAmigos = amistades.map((r) =>
      r.id_solicitante === idUsuario ? r.id_receptor : r.id_solicitante
    );
    const activos = await usuarioRepository.listarActivosPorIds(idsAmigos);
    const amigos = (await sinBloqueados(idQuienMira, activos)).length;
    return { conciertos, grupos, amigos };
  },

  // Ordenado de más a menos elegido por los usuarios de FanMeet.
  async obtenerCatalogoGeneros() {
    const [catalogo, selecciones] = await Promise.all([
      estiloMusicalRepository.listarCatalogo(),
      estiloMusicalRepository.listarTodasLasSelecciones(),
    ]);

    const elecciones = new Map();
    for (const { id_estilo } of selecciones) {
      const clave = String(id_estilo);
      elecciones.set(clave, (elecciones.get(clave) || 0) + 1);
    }

    const vecesElegido = (genero) => elecciones.get(String(genero.id)) || 0;
    return [...catalogo].sort((a, b) => vecesElegido(b) - vecesElegido(a));
  },

  async obtenerGenerosUsuario(idUsuario) {
    const filas = await estiloMusicalRepository.listarIdsPorUsuario(idUsuario);
    return filas.map((fila) => fila.id_estilo);
  },

  async guardarGeneros(idUsuarioAutenticado, idsEstilos) {
    await estiloMusicalRepository.reemplazarSeleccion(idUsuarioAutenticado, idsEstilos);
    return this.obtenerGenerosUsuario(idUsuarioAutenticado);
  },
};
