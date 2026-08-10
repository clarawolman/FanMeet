import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { conciertoRepository } from "../repositories/conciertoRepository.js";
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

    const grupoCreado = await grupoRepository.crear({
      ...datosGrupo,
      id_creador: idUsuarioAutenticado,
    });

    await grupoUsuarioRepository.crearRelacion(idUsuarioAutenticado, grupoCreado.id_grupo);

    return toGrupo(grupoCreado, { usuarios: [toUsuarioResumen(await usuarioRepository.obtenerPorId(idUsuarioAutenticado))] });
  },

  async obtenerDetalle(idGrupo) {
    const grupo = await grupoRepository.obtenerPorId(idGrupo);
    if (!grupo) throw ApiError.notFound("El grupo no existe");
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
