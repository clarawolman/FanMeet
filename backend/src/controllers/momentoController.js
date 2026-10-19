import { momentoService } from "../services/momentoService.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

export const momentoController = {
  listarDeUsuario: asyncHandler(async (req, res) => {
    res.json(await momentoService.listarDeUsuario(req.params.idUsuario, req.user.id));
  }),

  listarGuardados: asyncHandler(async (req, res) => {
    res.json(await momentoService.listarGuardados(req.user.id));
  }),

  obtener: asyncHandler(async (req, res) => {
    res.json(await momentoService.obtener(req.user.id, req.params.idHighlight));
  }),

  // Las fotos llegan en "fotos" (hasta 10); "highlight" es el campo viejo de una sola.
  subir: asyncHandler(async (req, res) => {
    const archivos = [...(req.files?.fotos || []), ...(req.files?.highlight || [])];
    const momento = await momentoService.subir(req.user.id, archivos, {
      descripcion: req.body.descripcion,
      idConcierto: req.body.id_concierto,
      etiquetados: req.body.etiquetados,
      comentariosActivados: req.body.comentarios_activados,
      ocultarLikes: req.body.ocultar_likes,
    });
    res.status(201).json(momento);
  }),

  editar: asyncHandler(async (req, res) => {
    const momento = await momentoService.editar(req.user.id, req.params.idHighlight, {
      descripcion: req.body.descripcion,
      idConcierto: req.body.id_concierto,
      comentariosActivados: req.body.comentarios_activados,
      ocultarLikes: req.body.ocultar_likes,
    });
    res.json(momento);
  }),

  aceptar: asyncHandler(async (req, res) => {
    res.json(await momentoService.aceptar(req.user.id, req.params.idHighlight));
  }),

  // Rechazar la invitación o sacarlo del propio perfil (a los demás les queda)
  quitar: asyncHandler(async (req, res) => {
    res.json(await momentoService.quitar(req.user.id, req.params.idHighlight));
  }),

  darLike: asyncHandler(async (req, res) => {
    res.json(await momentoService.darLike(req.user.id, req.params.idHighlight));
  }),

  quitarLike: asyncHandler(async (req, res) => {
    res.json(await momentoService.quitarLike(req.user.id, req.params.idHighlight));
  }),

  listarLikes: asyncHandler(async (req, res) => {
    res.json(await momentoService.listarLikes(req.user.id, req.params.idHighlight));
  }),

  comentar: asyncHandler(async (req, res) => {
    const comentario = await momentoService.comentar(req.user.id, req.params.idHighlight, {
      texto: req.body.texto,
      idRespuestaA: req.body.id_respuesta_a ?? null,
    });
    res.status(201).json(comentario);
  }),

  eliminarComentario: asyncHandler(async (req, res) => {
    res.json(
      await momentoService.eliminarComentario(req.user.id, req.params.idHighlight, req.params.idComentario)
    );
  }),

  darLikeComentario: asyncHandler(async (req, res) => {
    res.json(
      await momentoService.darLikeComentario(req.user.id, req.params.idHighlight, req.params.idComentario)
    );
  }),

  quitarLikeComentario: asyncHandler(async (req, res) => {
    res.json(await momentoService.quitarLikeComentario(req.user.id, req.params.idComentario));
  }),

  guardar: asyncHandler(async (req, res) => {
    res.json(await momentoService.guardar(req.user.id, req.params.idHighlight));
  }),

  quitarGuardado: asyncHandler(async (req, res) => {
    res.json(await momentoService.quitarGuardado(req.user.id, req.params.idHighlight));
  }),

  fijar: asyncHandler(async (req, res) => {
    res.json(await momentoService.fijar(req.user.id, req.params.idHighlight));
  }),

  desfijar: asyncHandler(async (req, res) => {
    res.json(await momentoService.desfijar(req.user.id, req.params.idHighlight));
  }),
};
