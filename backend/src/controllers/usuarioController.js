import { usuarioService } from "../services/usuarioService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";
import { ApiError } from "../helpers/ApiError.js";

export const usuarioController = {
  obtenerPerfil: asyncHandler(async (req, res) => {
    const usuario = await usuarioService.obtenerPerfil(req.params.idUsuario);
    res.json(usuario);
  }),

  obtenerMiPerfil: asyncHandler(async (req, res) => {
    const usuario = await usuarioService.obtenerPerfil(req.user.id);
    res.json(usuario);
  }),

  actualizarFoto: asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("Falta el archivo de la foto");
    const usuario = await usuarioService.actualizarFoto(req.user.id, req.file);
    res.json(usuario);
  }),

  actualizarVibra: asyncHandler(async (req, res) => {
    const usuario = await usuarioService.actualizarVibra(req.user.id, req.body.estilo_asistencia);
    res.json(usuario);
  }),

  obtenerEstadisticas: asyncHandler(async (req, res) => {
    const estadisticas = await usuarioService.obtenerEstadisticas(req.params.idUsuario);
    res.json(estadisticas);
  }),

  obtenerCatalogoGeneros: asyncHandler(async (_req, res) => {
    const catalogo = await usuarioService.obtenerCatalogoGeneros();
    res.json(catalogo);
  }),

  obtenerMisGeneros: asyncHandler(async (req, res) => {
    const generos = await usuarioService.obtenerGenerosUsuario(req.user.id);
    res.json(generos);
  }),

  // A diferencia de /me/generos, este lee los géneros de CUALQUIER perfil
  // (propio o ajeno) — lo usa perfil.jsx para mostrar los géneros de quien
  // se está viendo, sea o no el usuario autenticado.
  obtenerGenerosDeUsuario: asyncHandler(async (req, res) => {
    const generos = await usuarioService.obtenerGenerosUsuario(req.params.idUsuario);
    res.json(generos);
  }),

  guardarMisGeneros: asyncHandler(async (req, res) => {
    const generos = await usuarioService.guardarGeneros(req.user.id, req.body.ids_estilos);
    res.json(generos);
  }),

  listarHighlights: asyncHandler(async (req, res) => {
    const highlights = await usuarioService.listarHighlights(req.params.idUsuario);
    res.json(highlights);
  }),

  subirHighlight: asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("Falta el archivo del highlight");
    const highlight = await usuarioService.subirHighlight(req.user.id, req.file);
    res.status(201).json(highlight);
  }),
};
