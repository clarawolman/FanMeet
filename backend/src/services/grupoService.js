import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import {
  conciertoRepository,
  usuariosConciertosRepository,
} from "../repositories/conciertoRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { notificacionService } from "./notificacionService.js";
import { avisarCambiosDeGrupo } from "./avisoCambiosGrupo.js";
import { toGrupo, toGrupoConConcierto } from "../entities/Grupo.js";
import { toConciertoDetalle } from "../entities/Concierto.js";
import { toUsuarioResumen } from "../entities/Usuario.js";
import { ApiError } from "../helpers/ApiError.js";
import { contieneMalasPalabras, MENSAJE_MALAS_PALABRAS } from "../helpers/filtroPalabras.js";
import { CATEGORIA_COMUNIDAD, conciertosDelGrupo, fechasSeguidas } from "../helpers/gruposGenerales.js";

// Al bajar el cupo no puede quedar gente afuera. Se cuentan las relaciones
// (no solo los usuarios activos): un suspendido que vuelve sigue adentro.
export async function validarCupoNuevo(idGrupo, cupo) {
  if (cupo === null || cupo === undefined) return;
  const integrantes = await grupoUsuarioRepository.listarUsuariosPorGrupo(idGrupo);
  if (cupo < integrantes.length) {
    throw ApiError.badRequest(
      `Ya hay ${integrantes.length} integrantes: el cupo no puede ser menor`
    );
  }
}

// Ver un grupo o sumarse: alcanza con estar unido a una de sus fechas
// (un grupo general abarca varias, ver helpers/gruposGenerales.js).
export async function perteneceAlConciertoDelGrupo(idUsuario, grupo) {
  const ids = conciertosDelGrupo(grupo);
  if (ids.length === 1) return Boolean(await usuariosConciertosRepository.existeRelacion(idUsuario, ids[0]));
  return usuariosConciertosRepository.existeRelacionEnAlguno(idUsuario, ids);
}

// Las fechas seguidas de un concierto (él incluido), ordenadas.
export async function fechasSeguidasDe(concierto) {
  const mismas = await conciertoRepository.listarDeArtistaYEstadio(concierto.id_artista, concierto.id_estadio);
  return fechasSeguidas(concierto, mismas);
}

// Un grupo general (idsPedidos con más de una fecha) solo puede abarcar
// fechas seguidas del concierto desde el que se crea. Devuelve
// { id_concierto, ids_conciertos } para guardar: id_concierto es la primera
// fecha e ids_conciertos queda en null si es de una sola.
export async function prepararConciertosDelGrupo(concierto, idsPedidos) {
  const ids = [...new Set([concierto.id_concierto, ...(idsPedidos || [])].map(Number))];
  if (ids.length < 2) return { id_concierto: concierto.id_concierto, ids_conciertos: null };

  const elegidas = (await fechasSeguidasDe(concierto)).filter((c) => ids.includes(c.id_concierto));
  if (elegidas.length !== ids.length) {
    throw ApiError.badRequest("Un grupo general solo puede ser de fechas seguidas del mismo artista en el mismo estadio");
  }
  return { id_concierto: elegidas[0].id_concierto, ids_conciertos: elegidas.map((c) => c.id_concierto) };
}

// Al editar: un grupo de comunidad no tiene encuentro (se borran fecha, hora
// y lugar); cualquier otro tipo necesita los tres. Devuelve los cambios a guardar.
export function cambiosConEncuentro(anterior, cambios) {
  const categoria = cambios.categoria ?? anterior.categoria;
  if (categoria === CATEGORIA_COMUNIDAD) return { ...cambios, fecha: null, hora: null, ubicacion: null };

  const final = { ...anterior, ...cambios };
  if (!final.fecha || !final.hora || !final.ubicacion) {
    throw ApiError.badRequest("Para juntarse hacen falta la fecha, la hora y el punto de encuentro");
  }
  return cambios;
}

async function armarUsuariosDeGrupo(idGrupo) {
  const relaciones = await grupoUsuarioRepository.listarUsuariosPorGrupo(idGrupo);
  const idsUnicos = [...new Set(relaciones.map((r) => r.id_usuario))];
  if (idsUnicos.length === 0) return [];
  const filas = await usuarioRepository.listarActivosPorIds(idsUnicos);
  return filas.map(toUsuarioResumen);
}

export const grupoService = {
  // id_creador siempre sale de req.user.id (idUsuarioAutenticado), nunca
  // del body: cierra el hallazgo donde CrearGrupo.jsx mandaba id_creador
  // como prop de React sin verificacion server-side.
  async crear(idUsuarioAutenticado, { ids_conciertos: idsPedidos, ...datosGrupo }) {
    if (contieneMalasPalabras(`${datosGrupo.nombre} ${datosGrupo.descripcion || ""} ${datosGrupo.ubicacion || ""}`)) {
      throw ApiError.badRequest(MENSAJE_MALAS_PALABRAS);
    }

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
      ...(await prepararConciertosDelGrupo(concierto, idsPedidos)),
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

    const perteneceAlConcierto = await perteneceAlConciertoDelGrupo(idUsuarioAutenticado, grupo);
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

    // Mismo criterio que crear y obtenerDetalle: solo se suma quien entró
    // al concierto con el código (los ids de grupo son fáciles de adivinar).
    const perteneceAlConcierto = await perteneceAlConciertoDelGrupo(idUsuarioAutenticado, grupo);
    if (!perteneceAlConcierto) {
      throw ApiError.forbidden("No pertenecés al concierto de este grupo");
    }

    if (grupo.cupo) {
      const integrantes = await grupoUsuarioRepository.listarUsuariosPorGrupo(idGrupo);
      if (integrantes.length >= grupo.cupo) {
        throw new ApiError(409, "El grupo está completo");
      }
    }

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

  async actualizar(idUsuarioAutenticado, idGrupo, cambios) {
    const grupo = await grupoRepository.obtenerPorId(idGrupo);
    if (!grupo) throw ApiError.notFound("El grupo no existe");

    if (grupo.id_creador !== idUsuarioAutenticado) {
      throw ApiError.forbidden("Solo el creador puede editar el grupo");
    }

    const textos = [cambios.nombre, cambios.descripcion, cambios.ubicacion].filter(Boolean).join(" ");
    if (contieneMalasPalabras(textos)) {
      throw ApiError.badRequest(MENSAJE_MALAS_PALABRAS);
    }
    await validarCupoNuevo(idGrupo, cambios.cupo);

    const actualizado = await grupoRepository.actualizar(idGrupo, cambiosConEncuentro(grupo, cambios));
    await avisarCambiosDeGrupo(grupo, actualizado, { excepto: idUsuarioAutenticado });
    return toGrupo(actualizado, { usuarios: await armarUsuariosDeGrupo(idGrupo) });
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
