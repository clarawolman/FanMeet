import {
  conciertoRepository,
  usuariosConciertosRepository,
} from "../repositories/conciertoRepository.js";
import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { notificacionService } from "./notificacionService.js";
import { toConciertoDetalle, toConciertoResumen } from "../entities/Concierto.js";
import { toGrupo } from "../entities/Grupo.js";
import { toUsuarioResumen } from "../entities/Usuario.js";
import { ApiError } from "../helpers/ApiError.js";
import { env } from "../config/env.js";

async function armarUsuariosResumen(idsUsuario) {
  const idsUnicos = [...new Set(idsUsuario)];
  if (idsUnicos.length === 0) return [];
  const filas = await usuarioRepository.listarPorIds(idsUnicos);
  return filas.map(toUsuarioResumen);
}

async function armarGrupoConUsuarios(grupo) {
  const relaciones = await grupoUsuarioRepository.listarUsuariosPorGrupo(grupo.id_grupo);
  const usuarios = await armarUsuariosResumen(relaciones.map((r) => r.id_usuario));
  return toGrupo(grupo, { usuarios });
}

export const conciertoService = {
  async listar() {
    const filas = await conciertoRepository.listarTodos();
    return filas.map(toConciertoResumen);
  },

  async obtenerDetalle(idConcierto) {
    const concierto = await conciertoRepository.obtenerPorId(idConcierto);
    if (!concierto) throw ApiError.notFound(`No existe el concierto con id ${idConcierto}`);

    const [artista, estadio, gruposCrudos, relacionesConcierto] = await Promise.all([
      conciertoRepository.obtenerArtista(concierto.id_artista),
      conciertoRepository.obtenerEstadio(concierto.id_estadio),
      grupoRepository.listarPorConcierto(idConcierto),
      usuariosConciertosRepository.listarUsuariosPorConcierto(idConcierto),
    ]);

    const grupos = await Promise.all(gruposCrudos.map(armarGrupoConUsuarios));
    const usuarios = await armarUsuariosResumen(relacionesConcierto.map((r) => r.id_usuario));

    return toConciertoDetalle(concierto, { artista, estadio, grupos, usuarios });
  },

  // El codigo de acceso ahora se valida en el servidor (antes vivia
  // hardcodeado en el bundle del frontend, Home.jsx: CODIGO_PRUEBA).
  async unirsePorCodigo(idUsuarioAutenticado, idConcierto, codigo) {
    if (codigo.trim() !== env.conciertoAccessCode) {
      throw ApiError.badRequest("Código incorrecto");
    }

    const concierto = await conciertoRepository.obtenerPorId(idConcierto);
    if (!concierto) throw ApiError.notFound(`No existe el concierto con id ${idConcierto}`);

    const yaUnido = await usuariosConciertosRepository.existeRelacion(idUsuarioAutenticado, idConcierto);
    if (yaUnido) return { ok: true, yaUnido: true };

    await usuariosConciertosRepository.crearRelacion(idUsuarioAutenticado, idConcierto);
    await notificacionService.crear({
      idUsuario: idUsuarioAutenticado,
      tipo: "concierto_unido",
      titulo: concierto.nombre,
      descripcion: "Te uniste a este concierto",
      imagen: concierto.imagen || concierto.imagenConcierto || "",
      idConcierto,
    });

    return { ok: true, yaUnido: false };
  },

  async listarMisEventos(idUsuarioAutenticado) {
    const relaciones = await usuariosConciertosRepository.listarConciertosPorUsuario(
      idUsuarioAutenticado
    );

    const eventos = await Promise.all(
      relaciones.map(async ({ id_concierto }) => {
        const concierto = await conciertoRepository.obtenerPorId(id_concierto);
        if (!concierto) return null;

        const [artista, estadio] = await Promise.all([
          conciertoRepository.obtenerArtista(concierto.id_artista),
          conciertoRepository.obtenerEstadio(concierto.id_estadio),
        ]);

        return toConciertoDetalle(concierto, { artista, estadio });
      })
    );

    return eventos.filter(Boolean);
  },

  // Mismo efecto en cascada que hoy tiene MisEventos.jsx: salir de un
  // concierto tambien saca al usuario de todos los grupos de ese concierto.
  async salirDeConcierto(idUsuarioAutenticado, idConcierto) {
    const grupos = await grupoRepository.listarPorConcierto(idConcierto);
    const idsGrupo = grupos.map((g) => g.id_grupo);

    if (idsGrupo.length > 0) {
      await grupoUsuarioRepository.eliminarDeGruposIds(idUsuarioAutenticado, idsGrupo);
    }

    await usuariosConciertosRepository.eliminarRelacion(idUsuarioAutenticado, idConcierto);
    return { ok: true };
  },
};
