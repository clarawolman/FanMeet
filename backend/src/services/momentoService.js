import { highlightRepository } from "../repositories/highlightRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { amistadRepository } from "../repositories/amistadRepository.js";
import { storageRepository } from "../repositories/storageRepository.js";
import { notificacionRepository } from "../repositories/notificacionRepository.js";
import {
  conciertoRepository,
  usuariosConciertosRepository,
} from "../repositories/conciertoRepository.js";
import { notificacionService } from "./notificacionService.js";
import { toMomentoDetalle, toMomentoResumen } from "../entities/Highlight.js";
import { toUsuarioResumen } from "../entities/Usuario.js";
import { ApiError } from "../helpers/ApiError.js";
import { rutaArchivoUsuario } from "../helpers/sanitizeFilename.js";
import { esImagenValida } from "../helpers/validarImagen.js";
import { contieneMalasPalabras, MENSAJE_MALAS_PALABRAS } from "../helpers/filtroPalabras.js";
import { preferenciasDe } from "../helpers/preferencias.js";

// Momentos: publicaciones como las de Instagram (ver supabase/momentos_publicaciones.sql).
export const MAX_FOTOS = 10;
const MAX_ETIQUETADOS = 10;
const MAX_FIJADOS = 3;

const aceptados = (fila) =>
  (fila.highlight_usuario || []).filter((p) => p.estado === "aceptado").map((p) => p.id_usuario);

const nombreDe = (usuario) => usuario?.apodo || usuario?.nombre || "Alguien";

function idsDeAmigos(amistades, idUsuario) {
  return new Set(
    amistades.map((a) => (a.id_solicitante === idUsuario ? a.id_receptor : a.id_solicitante))
  );
}

// Usuarios activos (resumen) por id, para armar participantes, likes y comentarios
async function usuariosPorId(ids) {
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return new Map();
  const filas = await usuarioRepository.listarActivosPorIds(unicos);
  return new Map(filas.map((u) => [u.id_usuario, toUsuarioResumen(u)]));
}

// El autor primero; los suspendidos no aparecen
function armarParticipantes(fila, porId) {
  return aceptados(fila)
    .sort((a, b) => (a === fila.id_usuario ? -1 : b === fila.id_usuario ? 1 : 0))
    .map((id) => porId.get(id))
    .filter(Boolean);
}

// La grilla del perfil muestra cada momento como una entrada: con el
// nombre y la fecha del concierto.
async function conciertosPorId(filas) {
  const ids = [...new Set(filas.map((f) => f.id_concierto).filter(Boolean))];
  const conciertos = await Promise.all(ids.map((id) => conciertoRepository.obtenerPorId(id)));
  return new Map(
    conciertos
      .filter(Boolean)
      .map((c) => [String(c.id_concierto), { id_concierto: c.id_concierto, nombre: c.nombre, fecha: c.fecha }])
  );
}

async function armarResumenes(filas, idQuienMira) {
  const [porId, conciertos] = await Promise.all([usuariosPorId(filas.flatMap(aceptados)), conciertosPorId(filas)]);
  return filas
    .map((fila) => {
      const participantes = armarParticipantes(fila, porId);
      if (participantes.length === 0) return null;
      const mostrarLikes = !fila.ocultar_likes || aceptados(fila).includes(idQuienMira);
      const concierto = conciertos.get(String(fila.id_concierto)) || null;
      return toMomentoResumen(fila, { participantes, mostrarLikes, concierto });
    })
    .filter(Boolean);
}

// Un momento existe para los demás mientras alguien activo lo tenga en su perfil.
async function obtenerVisible(idHighlight) {
  const fila = await highlightRepository.obtenerDetalle(idHighlight);
  if (!fila) throw ApiError.notFound("El momento no existe");
  const porId = await usuariosPorId(aceptados(fila));
  const participantes = armarParticipantes(fila, porId);
  if (participantes.length === 0) throw ApiError.notFound("El momento no existe");
  return { fila, participantes };
}

// Comentarios con sus respuestas abajo (un nivel, como Instagram)
async function armarComentarios(filas, idQuienMira) {
  const porId = await usuariosPorId(filas.map((c) => c.id_usuario));
  const comentarios = filas
    .filter((c) => porId.has(c.id_usuario))
    .map((c) => {
      const likes = (c.highlight_comentario_like || []).map((l) => l.id_usuario);
      return {
        id_comentario: c.id_comentario,
        id_respuesta_a: c.id_respuesta_a,
        texto: c.texto,
        created_at: c.created_at,
        usuario: porId.get(c.id_usuario),
        cantidadLikes: likes.length,
        yoDiLike: likes.includes(idQuienMira),
        respuestas: [],
      };
    });

  const porComentario = new Map(comentarios.map((c) => [c.id_comentario, c]));
  const raiz = [];
  for (const comentario of comentarios) {
    const padre = comentario.id_respuesta_a && porComentario.get(comentario.id_respuesta_a);
    if (padre) padre.respuestas.push(comentario);
    else if (!comentario.id_respuesta_a) raiz.push(comentario);
  }
  return raiz;
}

async function exigirParticipante(idHighlight, idUsuario) {
  const participacion = await highlightRepository.obtenerParticipacion(idHighlight, idUsuario);
  if (!participacion || participacion.estado !== "aceptado") {
    throw ApiError.forbidden("Este momento no está en tu perfil");
  }
  return participacion;
}

async function validarConcierto(idUsuario, idConcierto) {
  if (idConcierto === undefined || idConcierto === null) return;
  const unido = await usuariosConciertosRepository.existeRelacion(idUsuario, idConcierto);
  if (!unido) throw ApiError.badRequest("Solo podés elegir un concierto al que te uniste");
}

function validarTexto(texto) {
  if (contieneMalasPalabras(texto)) throw ApiError.badRequest(MENSAJE_MALAS_PALABRAS);
}

// Avisa a los que tienen el momento en su perfil (menos a quien lo hizo)
async function notificarParticipantes(fila, idQuienHizo, { tipo, descripcion }) {
  const destinatarios = aceptados(fila).filter((id) => id !== idQuienHizo);
  if (destinatarios.length === 0) return;
  const quien = await usuarioRepository.obtenerPorId(idQuienHizo);
  await Promise.all(
    destinatarios.map((idUsuario) =>
      notificacionService.crear({
        idUsuario,
        tipo,
        titulo: nombreDe(quien),
        descripcion,
        imagen: fila.url_imagen,
        idUsuarioRelacionado: idQuienHizo,
        idHighlight: fila.id_highlight,
      })
    )
  );
}

// Perfil privado (Configuración): sus momentos los ven solo sus amigos.
// Un momento compartido se ve si alguno de los que lo tienen lo permite.
async function puedeVerMomentosDe(idQuienMira, idsDuenios) {
  if (idsDuenios.includes(idQuienMira)) return true;
  const duenios = await usuarioRepository.listarActivosPorIds(idsDuenios);
  if (duenios.some((u) => !preferenciasDe(u).perfil_privado)) return true;
  const amigos = idsDeAmigos(await amistadRepository.listarAceptadasDeUsuario(idQuienMira), idQuienMira);
  return idsDuenios.some((id) => amigos.has(id));
}

export const momentoService = {
  // Grilla del perfil: primero los fijados, después del más nuevo al más viejo.
  async listarDeUsuario(idUsuario, idQuienMira) {
    if (!(await puedeVerMomentosDe(idQuienMira, [idUsuario]))) return [];
    const filas = await highlightRepository.listarPorUsuario(idUsuario);
    const fijados = filas
      .filter((f) => f.fijado_at)
      .sort((a, b) => String(b.fijado_at).localeCompare(String(a.fijado_at)));
    const resto = filas.filter((f) => !f.fijado_at);
    return armarResumenes([...fijados, ...resto], idQuienMira);
  },

  // Solo los propios: nadie más ve qué guardaste
  async listarGuardados(idUsuarioAutenticado) {
    const filas = await highlightRepository.listarGuardados(idUsuarioAutenticado);
    return (await armarResumenes(filas, idUsuarioAutenticado)).map((m) => ({ ...m, fijado: false }));
  },

  async obtener(idQuienMira, idHighlight) {
    const { fila, participantes } = await obtenerVisible(idHighlight);
    if (!(await puedeVerMomentosDe(idQuienMira, participantes.map((u) => u.id_usuario)))) {
      throw ApiError.forbidden("Este momento lo ven solo los amigos de quien lo subió");
    }
    const [likes, comentariosCrudos, guardado, concierto] = await Promise.all([
      highlightRepository.listarLikes(idHighlight),
      highlightRepository.listarComentarios(idHighlight),
      highlightRepository.estaGuardado(idHighlight, idQuienMira),
      fila.id_concierto ? conciertoRepository.obtenerPorId(fila.id_concierto) : null,
    ]);

    const miParticipacion = (fila.highlight_usuario || []).find(
      (p) => p.id_usuario === idQuienMira && p.estado === "aceptado"
    );
    const soyParticipante = Boolean(miParticipacion);

    return toMomentoDetalle(fila, {
      participantes,
      concierto: concierto && {
        id_concierto: concierto.id_concierto,
        nombre: concierto.nombre,
        fecha: concierto.fecha,
      },
      comentarios: await armarComentarios(comentariosCrudos, idQuienMira),
      cantidadLikes: !fila.ocultar_likes || soyParticipante ? likes.length : null,
      yoDiLike: likes.some((l) => l.id_usuario === idQuienMira),
      guardado,
      soyAutor: fila.id_usuario === idQuienMira,
      soyParticipante,
      fijado: Boolean(miParticipacion?.fijado_at),
    });
  },

  // Publicar: hasta 10 fotos, pie de foto, concierto, amigos etiquetados
  // (les llega la invitación) y las opciones de likes/comentarios.
  async subir(idUsuarioAutenticado, archivos, opciones = {}) {
    const {
      descripcion = "",
      idConcierto = null,
      etiquetados: idsEtiquetados = [],
      comentariosActivados = true,
      ocultarLikes = false,
    } = opciones;

    if (!archivos || archivos.length === 0) throw ApiError.badRequest("Elegí al menos una foto");
    if (archivos.length > MAX_FOTOS) throw ApiError.badRequest(`Podés subir hasta ${MAX_FOTOS} fotos`);
    if (archivos.some((archivo) => !esImagenValida(archivo))) {
      throw ApiError.badRequest("Las fotos tienen que ser imágenes válidas (jpg, png o webp)");
    }
    validarTexto(descripcion);
    await validarConcierto(idUsuarioAutenticado, idConcierto);

    const etiquetados = [...new Set(idsEtiquetados)].filter((id) => id !== idUsuarioAutenticado);
    if (etiquetados.length > MAX_ETIQUETADOS) {
      throw ApiError.badRequest(`Podés etiquetar hasta ${MAX_ETIQUETADOS} personas`);
    }

    // Solo amigos activos: si no, cualquiera podría llenarle las
    // notificaciones a un desconocido.
    if (etiquetados.length > 0) {
      const amigos = idsDeAmigos(
        await amistadRepository.listarAceptadasDeUsuario(idUsuarioAutenticado),
        idUsuarioAutenticado
      );
      const activos = await usuarioRepository.listarActivosPorIds(etiquetados);
      if (activos.length !== etiquetados.length || etiquetados.some((id) => !amigos.has(id))) {
        throw ApiError.badRequest("Solo podés etiquetar a tus amigos");
      }
      const sinEtiquetas = activos.filter((u) => preferenciasDe(u).etiquetas === "nadie");
      if (sinEtiquetas.length > 0) {
        throw ApiError.badRequest(
          `${sinEtiquetas.map((u) => u.apodo || u.nombre).join(", ")} no acepta etiquetas en momentos`
        );
      }
    }

    const urls = [];
    for (const archivo of archivos) {
      const ruta = rutaArchivoUsuario(idUsuarioAutenticado, archivo.originalname);
      urls.push(await storageRepository.subirArchivo("highlights", ruta, archivo.buffer, archivo.mimetype));
    }

    const highlight = await highlightRepository.crear({
      id_usuario: idUsuarioAutenticado,
      url_imagen: urls[0],
      descripcion: descripcion || null,
      id_concierto: idConcierto,
      comentarios_activados: comentariosActivados,
      ocultar_likes: ocultarLikes,
    });
    await highlightRepository.agregarFotos(highlight.id_highlight, urls);
    await highlightRepository.agregarParticipantes(highlight.id_highlight, [
      { id_usuario: idUsuarioAutenticado, estado: "aceptado" },
      ...etiquetados.map((id) => ({ id_usuario: id, estado: "pendiente" })),
    ]);

    if (etiquetados.length > 0) {
      const autor = await usuarioRepository.obtenerPorId(idUsuarioAutenticado);
      await Promise.all(
        etiquetados.map((idUsuario) =>
          notificacionService.crear({
            idUsuario,
            tipo: "momento_etiquetado",
            titulo: nombreDe(autor),
            descripcion: "Te etiquetó en un momento. ¿Lo sumás a tus momentos?",
            imagen: urls[0],
            idUsuarioRelacionado: idUsuarioAutenticado,
            idHighlight: highlight.id_highlight,
          })
        )
      );
    }

    return { id_highlight: highlight.id_highlight };
  },

  // Editar como en Instagram: pie de foto, concierto y opciones. Las fotos no.
  async editar(idUsuarioAutenticado, idHighlight, cambios) {
    const fila = await highlightRepository.obtenerPorId(idHighlight);
    if (!fila) throw ApiError.notFound("El momento no existe");
    if (fila.id_usuario !== idUsuarioAutenticado) {
      throw ApiError.forbidden("Solo quien subió el momento lo puede editar");
    }

    // Solo lo que de verdad cambió: así "Editado" aparece si cambió el pie o
    // el concierto, y dejar el mismo concierto no pide seguir unido a él.
    const datos = {};
    const descripcion = cambios.descripcion === undefined ? undefined : cambios.descripcion || null;
    if (descripcion !== undefined && descripcion !== (fila.descripcion || null)) {
      validarTexto(descripcion);
      datos.descripcion = descripcion;
    }
    if (cambios.idConcierto !== undefined && String(cambios.idConcierto) !== String(fila.id_concierto ?? null)) {
      await validarConcierto(idUsuarioAutenticado, cambios.idConcierto);
      datos.id_concierto = cambios.idConcierto;
    }
    if (cambios.comentariosActivados !== undefined) datos.comentarios_activados = cambios.comentariosActivados;
    if (cambios.ocultarLikes !== undefined) datos.ocultar_likes = cambios.ocultarLikes;

    if (datos.descripcion !== undefined || datos.id_concierto !== undefined) {
      datos.editado_at = new Date().toISOString();
    }
    if (Object.keys(datos).length > 0) await highlightRepository.actualizar(idHighlight, datos);
    return momentoService.obtener(idUsuarioAutenticado, idHighlight);
  },

  // ── Me gusta ───────────────────────────────────────────────────────────
  async darLike(idUsuarioAutenticado, idHighlight) {
    const { fila } = await obtenerVisible(idHighlight);
    const yaEstaba = (await highlightRepository.listarLikes(idHighlight)).some(
      (l) => l.id_usuario === idUsuarioAutenticado
    );
    if (yaEstaba) return { ok: true };

    await highlightRepository.darLike(idHighlight, idUsuarioAutenticado);
    await notificarParticipantes(fila, idUsuarioAutenticado, {
      tipo: "momento_like",
      descripcion: "Le gustó tu momento",
    });
    return { ok: true };
  },

  async quitarLike(idUsuarioAutenticado, idHighlight) {
    await highlightRepository.quitarLike(idHighlight, idUsuarioAutenticado);
    // El aviso de "le gustó" ya no corresponde
    await notificacionRepository.eliminarDeMomento({
      tipo: "momento_like",
      idHighlight,
      idUsuarioRelacionado: idUsuarioAutenticado,
    });
    return { ok: true };
  },

  // Si el autor ocultó la cantidad, la lista la ven solo los participantes
  async listarLikes(idQuienMira, idHighlight) {
    const { fila } = await obtenerVisible(idHighlight);
    if (fila.ocultar_likes && !aceptados(fila).includes(idQuienMira)) {
      throw ApiError.forbidden("Los me gusta de este momento están ocultos");
    }
    const likes = await highlightRepository.listarLikes(idHighlight);
    const porId = await usuariosPorId(likes.map((l) => l.id_usuario));
    return likes.map((l) => porId.get(l.id_usuario)).filter(Boolean);
  },

  // ── Comentarios ────────────────────────────────────────────────────────
  async comentar(idUsuarioAutenticado, idHighlight, { texto, idRespuestaA = null }) {
    const { fila } = await obtenerVisible(idHighlight);
    if (fila.comentarios_activados === false) {
      throw ApiError.badRequest("Los comentarios de este momento están desactivados");
    }
    validarTexto(texto);

    // Responder a una respuesta cuelga del mismo comentario de arriba
    let respuestaA = null;
    let autorComentarioRespondido = null;
    if (idRespuestaA) {
      const respondido = await highlightRepository.obtenerComentario(idRespuestaA);
      if (!respondido || String(respondido.id_highlight) !== String(idHighlight)) {
        throw ApiError.notFound("El comentario que querés responder ya no existe");
      }
      respuestaA = respondido.id_respuesta_a || respondido.id_comentario;
      autorComentarioRespondido = respondido.id_usuario;
    }

    const comentario = await highlightRepository.crearComentario({
      id_highlight: idHighlight,
      id_usuario: idUsuarioAutenticado,
      id_respuesta_a: respuestaA,
      texto,
    });

    const resumen = texto.length > 80 ? `${texto.slice(0, 80)}…` : texto;
    await notificarParticipantes(fila, idUsuarioAutenticado, {
      tipo: "momento_comentario",
      descripcion: `Comentó: “${resumen}”`,
    });
    // A quien le respondieron también le llega, si no es participante (ya le llegó)
    if (
      autorComentarioRespondido &&
      autorComentarioRespondido !== idUsuarioAutenticado &&
      !aceptados(fila).includes(autorComentarioRespondido)
    ) {
      const quien = await usuarioRepository.obtenerPorId(idUsuarioAutenticado);
      await notificacionService.crear({
        idUsuario: autorComentarioRespondido,
        tipo: "momento_comentario",
        titulo: nombreDe(quien),
        descripcion: `Respondió tu comentario: “${resumen}”`,
        imagen: fila.url_imagen,
        idUsuarioRelacionado: idUsuarioAutenticado,
        idHighlight: fila.id_highlight,
      });
    }

    return { id_comentario: comentario.id_comentario };
  },

  // Lo puede borrar quien lo escribió o cualquiera que tenga el momento en su perfil
  async eliminarComentario(idUsuarioAutenticado, idHighlight, idComentario) {
    const comentario = await highlightRepository.obtenerComentario(idComentario);
    if (!comentario || String(comentario.id_highlight) !== String(idHighlight)) {
      throw ApiError.notFound("El comentario no existe");
    }
    if (comentario.id_usuario !== idUsuarioAutenticado) {
      const participacion = await highlightRepository.obtenerParticipacion(idHighlight, idUsuarioAutenticado);
      if (participacion?.estado !== "aceptado") {
        throw ApiError.forbidden("No podés borrar este comentario");
      }
    }
    await highlightRepository.eliminarComentario(idComentario);
    return { ok: true };
  },

  async darLikeComentario(idUsuarioAutenticado, idHighlight, idComentario) {
    const comentario = await highlightRepository.obtenerComentario(idComentario);
    if (!comentario || String(comentario.id_highlight) !== String(idHighlight)) {
      throw ApiError.notFound("El comentario no existe");
    }
    await highlightRepository.darLikeComentario(idComentario, idUsuarioAutenticado);
    return { ok: true };
  },

  async quitarLikeComentario(idUsuarioAutenticado, idComentario) {
    await highlightRepository.quitarLikeComentario(idComentario, idUsuarioAutenticado);
    return { ok: true };
  },

  // ── Guardados y fijados ────────────────────────────────────────────────
  async guardar(idUsuarioAutenticado, idHighlight) {
    await obtenerVisible(idHighlight);
    await highlightRepository.guardar(idHighlight, idUsuarioAutenticado);
    return { ok: true };
  },

  async quitarGuardado(idUsuarioAutenticado, idHighlight) {
    await highlightRepository.quitarGuardado(idHighlight, idUsuarioAutenticado);
    return { ok: true };
  },

  async fijar(idUsuarioAutenticado, idHighlight) {
    const participacion = await exigirParticipante(idHighlight, idUsuarioAutenticado);
    if (participacion.fijado_at) return { ok: true };
    if ((await highlightRepository.contarFijados(idUsuarioAutenticado)) >= MAX_FIJADOS) {
      throw ApiError.badRequest(`Podés fijar hasta ${MAX_FIJADOS} momentos. Desfijá uno primero.`);
    }
    await highlightRepository.fijar(idHighlight, idUsuarioAutenticado, new Date().toISOString());
    return { ok: true };
  },

  async desfijar(idUsuarioAutenticado, idHighlight) {
    await exigirParticipante(idHighlight, idUsuarioAutenticado);
    await highlightRepository.fijar(idHighlight, idUsuarioAutenticado, null);
    return { ok: true };
  },

  // ── Etiquetas (colaboradores) ──────────────────────────────────────────
  // Aceptar la invitación desde la notificación: pasa a estar en su perfil.
  async aceptar(idUsuarioAutenticado, idHighlight) {
    const participacion = await highlightRepository.obtenerParticipacion(idHighlight, idUsuarioAutenticado);
    if (!participacion) throw ApiError.notFound("El momento ya no existe");

    if (participacion.estado !== "aceptado") {
      await highlightRepository.aceptarParticipacion(idHighlight, idUsuarioAutenticado);
    }
    await notificacionRepository.eliminarInvitacionMomento(idUsuarioAutenticado, idHighlight);
    return { ok: true };
  },

  // Rechazar la invitación o borrar un momento del propio perfil: solo se
  // quita de los momentos de quien lo hace; al resto le sigue apareciendo.
  // Cuando ya no lo tiene nadie, se borran las fotos.
  async quitar(idUsuarioAutenticado, idHighlight) {
    const participacion = await highlightRepository.obtenerParticipacion(idHighlight, idUsuarioAutenticado);
    if (!participacion) throw ApiError.notFound("El momento no está en tu perfil");

    await highlightRepository.quitarParticipacion(idHighlight, idUsuarioAutenticado);
    await notificacionRepository.eliminarInvitacionMomento(idUsuarioAutenticado, idHighlight);

    const quedan = await highlightRepository.contarParticipantes(idHighlight);
    if (quedan === 0) {
      const fotos = await highlightRepository.listarFotos(idHighlight);
      const highlight = await highlightRepository.obtenerPorId(idHighlight);
      await highlightRepository.eliminar(idHighlight);
      const urls = new Set([...fotos.map((f) => f.url_imagen), highlight?.url_imagen].filter(Boolean));
      await Promise.all([...urls].map((url) => storageRepository.eliminarPorUrl("highlights", url)));
    }

    return { ok: true };
  },
};
