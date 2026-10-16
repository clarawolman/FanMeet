import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { highlightRepository } from "../repositories/highlightRepository.js";
import { storageRepository } from "../repositories/storageRepository.js";
import { usuariosConciertosRepository } from "../repositories/conciertoRepository.js";
import { grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { amistadRepository } from "../repositories/amistadRepository.js";
import { toUsuarioCompleto, toUsuarioPublico, toUsuarioResumen } from "../entities/Usuario.js";
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
  // Un suspendido se ve como inexistente para el resto.
  async obtenerPerfilPublico(idUsuario) {
    const usuario = await usuarioRepository.obtenerPorId(idUsuario);
    if (!usuario || usuario.estado === "suspendido") throw ApiError.notFound("El usuario no existe");
    return toUsuarioPublico(usuario);
  },

  // Buscador de "Descubrir": forma resumida, sin mail ni fecha de nacimiento.
  async buscar(idUsuarioAutenticado, texto) {
    const filas = await usuarioRepository.buscarActivos(texto, idUsuarioAutenticado);
    return filas.map(toUsuarioResumen);
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

  // Vacío borra el apodo y el perfil vuelve a mostrar el nombre de usuario.
  async actualizarApodo(idUsuarioAutenticado, apodo) {
    const usuario = await usuarioRepository.actualizar(idUsuarioAutenticado, {
      apodo: apodo || null,
    });
    return toUsuarioCompleto(usuario);
  },

  // Mismos 3 contadores que hoy calcula perfil.jsx::cargarEstadisticas.
  // Los amigos suspendidos no cuentan (tampoco aparecen en la lista).
  async obtenerEstadisticas(idUsuario) {
    const [conciertos, grupos, amistades] = await Promise.all([
      usuariosConciertosRepository.contarPorUsuario(idUsuario),
      grupoUsuarioRepository.contarPorUsuario(idUsuario),
      amistadRepository.listarAceptadasDeUsuario(idUsuario),
    ]);
    const idsAmigos = amistades.map((r) =>
      r.id_solicitante === idUsuario ? r.id_receptor : r.id_solicitante
    );
    const amigos = (await usuarioRepository.listarActivosPorIds(idsAmigos)).length;
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
