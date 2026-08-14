import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import {
  conciertoRepository,
  usuariosConciertosRepository,
} from "../repositories/conciertoRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { notificacionService } from "./notificacionService.js";
import { toGrupo, toGrupoConConcierto } from "../entities/Grupo.js";
import { toConciertoDetalle } from "../entities/Concierto.js";
import { toUsuarioResumen } from "../entities/Usuario.js";
import { ApiError } from "../helpers/ApiError.js";

async function armarUsuariosDeGrupo(idGrupo) {
  const relaciones = await grupoUsuarioRepository.listarUsuariosPorGrupo(idGrupo);
  const idsUnicos = [...new Set(relaciones.map((r) => r.id_usuario))];
  if (idsUnicos.length === 0) return [];
  const filas = await usuarioRepository.listarPorIds(idsUnicos);
  return filas.map(toUsuarioResumen);
}

export const grupoService = {
  // id_creador siempre sale de req.user.id (idUsuarioAutenticado), nunca
  // del body: cierra el hallazgo donde CrearGrupo.jsx mandaba id_creador
  // como prop de React sin verificacion server-side.
  async crear(idUsuarioAutenticado, datosGrupo) {
    const concierto = await conciertoRepository.obtenerPorId(datosGrupo.id_concierto);
    if (!concierto) throw ApiError.notFound("El concierto no existe");

    // Sin esto, cualquier cuenta autenticada podía crear grupos dentro de
    // conciertos a los que nunca entró con el código de acceso.
    const perteneceAlConcierto = await usuariosConciertosRepository.existeRelacion(
      idUsuarioAutenticado,
      datosGrupo.id_concierto
    );
    if (!perteneceAlConcierto) {
      throw ApiError.forbidden("No pertenecés a este concierto");
    }

    const grupoCreado = await grupoRepository.crear({
      ...datosGrupo,
      id_creador: idUsuarioAutenticado,
    });

    await grupoUsuarioRepository.crearRelacion(idUsuarioAutenticado, grupoCreado.id_grupo);

    return toGrupo(grupoCreado, { usuarios: [toUsuarioResumen(await usuarioRepository.obtenerPorId(idUsuarioAutenticado))] });
  },

  // Mismo criterio que conciertoService.obtenerDetalle: ver un grupo
  // requiere pertenecer al concierto al que ese grupo pertenece (los ids
  // de grupo son enteros secuenciales, fáciles de enumerar).
  async obtenerDetalle(idUsuarioAutenticado, idGrupo) {
    const grupo = await grupoRepository.obtenerPorId(idGrupo);
    if (!grupo) throw ApiError.notFound("El grupo no existe");

    const perteneceAlConcierto = await usuariosConciertosRepository.existeRelacion(
      idUsuarioAutenticado,
      grupo.id_concierto
    );
    if (!perteneceAlConcierto) {
      throw ApiError.forbidden("No pertenecés al concierto de este grupo");
    }

    const usuarios = await armarUsuariosDeGrupo(idGrupo);
    return toGrupo(grupo, { usuarios });
  },

  async listarMisGrupos(idUsuarioAutenticado) {
    const relaciones = await grupoUsuarioRepository.listarGruposPorUsuario(idUsuarioAutenticado);

    const grupos = await Promise.all(
      relaciones.map(async ({ id_grupo }) => {
        const grupo = await grupoRepository.obtenerPorId(id_grupo);
        if (!grupo) return null;

        const [concierto, usuarios] = await Promise.all([
          (async () => {
            const c = await conciertoRepository.obtenerPorId(grupo.id_concierto);
            if (!c) return null;
            const [artista, estadio] = await Promise.all([
              conciertoRepository.obtenerArtista(c.id_artista),
              conciertoRepository.obtenerEstadio(c.id_estadio),
            ]);
            return toConciertoDetalle(c, { artista, estadio });
          })(),
          armarUsuariosDeGrupo(id_grupo),
        ]);

        return toGrupoConConcierto(grupo, { concierto, usuarios });
      })
    );

    return grupos.filter(Boolean);
  },

  async unirse(idUsuarioAutenticado, idGrupo) {
    const grupo = await grupoRepository.obtenerPorId(idGrupo);
    if (!grupo) throw ApiError.notFound("El grupo no existe");

    const yaConfirmado = await grupoUsuarioRepository.existeRelacion(idUsuarioAutenticado, idGrupo);
    if (yaConfirmado) return { ok: true, yaConfirmado: true };

    await grupoUsuarioRepository.crearRelacion(idUsuarioAutenticado, idGrupo);
    await notificacionService.crear({
      idUsuario: idUsuarioAutenticado,
      tipo: "grupo_unido",
      titulo: grupo.nombre,
      descripcion: "Te uniste a este grupo",
      imagen: grupo.foto || "",
      idGrupo,
    });

    return { ok: true, yaConfirmado: false };
  },

  async salir(idUsuarioAutenticado, idGrupo) {
    await grupoUsuarioRepository.eliminarRelacion(idUsuarioAutenticado, idGrupo);
    return { ok: true };
  },

  // Autorizacion real en el backend: antes esto dependia solo de ocultar
  // el boton "Eliminar grupo" en infoGrupo.jsx (esCreador calculado en
  // cliente) y de que existiera la RLS de eliminar_grupo.sql.
  async eliminar(idUsuarioAutenticado, idGrupo) {
    const grupo = await grupoRepository.obtenerPorId(idGrupo);
    if (!grupo) throw ApiError.notFound("El grupo no existe");

    if (grupo.id_creador !== idUsuarioAutenticado) {
      throw ApiError.forbidden("Solo el creador puede eliminar el grupo");
    }

    await grupoUsuarioRepository.eliminarTodosDeGrupo(idGrupo);
    await grupoRepository.eliminar(idGrupo);
    return { ok: true };
  },
};
