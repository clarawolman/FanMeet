import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { highlightRepository } from "../repositories/highlightRepository.js";
import { storageRepository } from "../repositories/storageRepository.js";
import { usuariosConciertosRepository } from "../repositories/conciertoRepository.js";
import { grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { amistadRepository } from "../repositories/amistadRepository.js";
import { toUsuarioCompleto, toUsuarioPublico } from "../entities/Usuario.js";
import { toHighlight } from "../entities/Highlight.js";
import { ApiError } from "../helpers/ApiError.js";
import { rutaArchivoUsuario } from "../helpers/sanitizeFilename.js";
import { esImagenValida } from "../helpers/validarImagen.js";

const MAX_HIGHLIGHTS = 4;

export const usuarioService = {
  // Uso exclusivo para el propio usuario autenticado (GET /usuarios/me):
  // incluye mail/fechanac/genero.
  async obtenerPerfil(idUsuario) {
    const usuario = await usuarioRepository.obtenerPorId(idUsuario);
    if (!usuario) throw ApiError.notFound("El usuario no existe");
    return toUsuarioCompleto(usuario);
  },

  // Uso para ver el perfil de OTRO usuario: nunca mail/fechanac/genero.
  async obtenerPerfilPublico(idUsuario) {
    const usuario = await usuarioRepository.obtenerPorId(idUsuario);
    if (!usuario) throw ApiError.notFound("El usuario no existe");
    return toUsuarioPublico(usuario);
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

  async actualizarVibra(idUsuarioAutenticado, estiloAsistencia) {
    const usuario = await usuarioRepository.actualizar(idUsuarioAutenticado, {
      estilo_asistencia: estiloAsistencia,
    });
    return toUsuarioCompleto(usuario);
  },

  // Mismos 3 contadores que hoy calcula perfil.jsx::cargarEstadisticas.
  async obtenerEstadisticas(idUsuario) {
    const [conciertos, grupos, amigos] = await Promise.all([
      usuariosConciertosRepository.contarPorUsuario(idUsuario),
      grupoUsuarioRepository.contarPorUsuario(idUsuario),
      amistadRepository.contarAceptadasDeUsuario(idUsuario),
    ]);
    return { conciertos, grupos, amigos };
  },

  async obtenerCatalogoGeneros() {
    return estiloMusicalRepository.listarCatalogo();
  },

  async obtenerGenerosUsuario(idUsuario) {
    const filas = await estiloMusicalRepository.listarIdsPorUsuario(idUsuario);
    return filas.map((fila) => fila.id_estilo);
  },

  async guardarGeneros(idUsuarioAutenticado, idsEstilos) {
    await estiloMusicalRepository.reemplazarSeleccion(idUsuarioAutenticado, idsEstilos);
    return this.obtenerGenerosUsuario(idUsuarioAutenticado);
  },

  async listarHighlights(idUsuario) {
    const filas = await highlightRepository.listarPorUsuario(idUsuario);
    return filas.map(toHighlight);
  },

  async subirHighlight(idUsuarioAutenticado, archivo) {
    if (!esImagenValida(archivo)) {
      throw ApiError.badRequest("El archivo debe ser una imagen válida (jpg, png o webp)");
    }

    const existentes = await highlightRepository.listarPorUsuario(idUsuarioAutenticado);
    if (existentes.length >= MAX_HIGHLIGHTS) {
      throw ApiError.badRequest(`Ya alcanzaste el máximo de ${MAX_HIGHLIGHTS} highlights`);
    }

    const ruta = rutaArchivoUsuario(idUsuarioAutenticado, archivo.originalname);
    const url = await storageRepository.subirArchivo("highlights", ruta, archivo.buffer, archivo.mimetype);
    const highlight = await highlightRepository.crear(idUsuarioAutenticado, url);
    return toHighlight(highlight);
  },
};
