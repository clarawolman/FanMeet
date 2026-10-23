import { backofficeRepository } from "../repositories/backofficeRepository.js";
import { reporteRepository } from "../repositories/reporteRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import {
  conciertoRepository,
  usuariosConciertosRepository,
} from "../repositories/conciertoRepository.js";
import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { mensajeRepository } from "../repositories/mensajeRepository.js";
import { storageRepository } from "../repositories/storageRepository.js";
import { mensajePrivadoRepository } from "../repositories/mensajePrivadoRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { artistaFavoritoRepository } from "../repositories/artistaFavoritoRepository.js";
import { normalizarGenero } from "../helpers/generos.js";
import { claveConcierto, esUrlHttp, leerFechaHora, leerFilas } from "../helpers/importarConciertos.js";
import { claveGrupo, leerCategoria, leerFilasGrupos } from "../helpers/importarGrupos.js";
import { problemaConImagen } from "../helpers/imagenRemota.js";
import { CUPO_MAXIMO, CUPO_MINIMO } from "../validators/grupoValidators.js";
import { conciertoYaPaso } from "../helpers/fechas.js";
import { toConciertoResumen } from "../entities/Concierto.js";
import { ApiError } from "../helpers/ApiError.js";
import { env } from "../config/env.js";
import { olvidarEstadoUsuario } from "../middlewares/authMiddleware.js";
import { avisarCambiosDeGrupo } from "./avisoCambiosGrupo.js";
import { cambiosConEncuentro, prepararConciertosDelGrupo, validarCupoNuevo } from "./grupoService.js";
import { CATEGORIA_COMUNIDAD, conciertosDelGrupo, esGrupoGeneral, fechasSeguidas } from "../helpers/gruposGenerales.js";

// Cuántos mensajes de contexto ve el moderador al revisar un reporte.
const MENSAJES_DE_CONTEXTO = 100;

// Fotos de los chats de grupo (bucket "chats", carpeta grupos/<id>, ver
// services/fotosChat.js). Se borran después que los grupos: si falla, el
// grupo ya no existe y solo quedan archivos sueltos, así que no corta la baja.
async function borrarFotosDeGrupos(idsGrupo) {
  for (const idGrupo of idsGrupo) {
    try {
      await storageRepository.eliminarCarpeta("chats", `grupos/${idGrupo}`);
    } catch (error) {
      console.error(`No se pudieron borrar las fotos del grupo ${idGrupo}:`, error);
    }
  }
}

function resumenUsuario(fila) {
  if (!fila) return null;
  return {
    id_usuario: fila.id_usuario,
    nombre: fila.nombre,
    mail: fila.mail,
    fotoperfil: fila.fotoperfil,
    estado: fila.estado || "activo",
    rol: fila.rol || "usuario",
    motivo_suspension: fila.motivo_suspension || null,
    suspendido_at: fila.suspendido_at || null,
  };
}

async function usuariosPorId(ids) {
  const unicos = [...new Set(ids.filter(Boolean))];
  if (unicos.length === 0) return new Map();
  const filas = await usuarioRepository.listarPorIds(unicos);
  return new Map(filas.map((f) => [f.id_usuario, resumenUsuario(f)]));
}

async function completarReportes(reportes) {
  const usuarios = await usuariosPorId(
    reportes.flatMap((r) => [r.id_reportante, r.id_reportado, r.id_moderador])
  );
  const idsGrupo = [...new Set(reportes.map((r) => r.id_grupo).filter(Boolean))];
  const grupos = idsGrupo.length ? await grupoRepository.listarPorIds(idsGrupo) : [];
  const nombresGrupo = new Map(grupos.map((g) => [g.id_grupo, g.nombre]));

  return reportes.map((r) => ({
    ...r,
    reportante: usuarios.get(r.id_reportante) || null,
    reportado: usuarios.get(r.id_reportado) || null,
    moderador: usuarios.get(r.id_moderador) || null,
    grupo: r.id_grupo ? { id_grupo: r.id_grupo, nombre: nombresGrupo.get(r.id_grupo) || "Grupo eliminado" } : null,
  }));
}

function armarMensajes(filas, usuarios, campoAutor) {
  return filas.map((m) => ({
    id_mensaje: m.id_mensaje,
    contenido: m.contenido,
    imagen: m.imagen || null,
    created_at: m.created_at,
    autor: usuarios.get(m[campoAutor]) || { id_usuario: m[campoAutor], nombre: "Usuario" },
  }));
}

// Avisa a todos los fans unidos a un concierto, pero solo si son
// "muchos" (MINIMO_UNIDOS_PARA_NOTIFICAR). Devuelve a cuántos les llegó.
async function notificarFans(concierto, { titulo, descripcion }) {
  const relaciones = await usuariosConciertosRepository.listarUsuariosPorConcierto(
    concierto.id_concierto
  );
  const minimo = env.minimoUnidosParaNotificar;
  if (relaciones.length < minimo) {
    return { notificados: 0, unidos: relaciones.length, minimo };
  }

  await backofficeRepository.crearNotificaciones(
    relaciones.map((r) => ({
      id_usuario: r.id_usuario,
      tipo: "novedad_concierto",
      titulo,
      descripcion,
      imagen: concierto.imagenConcierto || "",
      id_concierto: concierto.id_concierto,
    }))
  );
  return { notificados: relaciones.length, unidos: relaciones.length, minimo };
}

// Los que siguen al artista desde su perfil (artista_favorito). Si el
// moderador lo eligió de Spotify se busca por id; si lo escribió a mano, por
// nombre sin mayúsculas ni tildes.
async function seguidoresDe(artista) {
  if (artista.spotify_id) {
    const favoritos = await artistaFavoritoRepository.listarPorSpotifyId(artista.spotify_id);
    return [...new Set(favoritos.map((f) => f.id_usuario))];
  }
  const clave = normalizarGenero(artista.nombre);
  const favoritos = await artistaFavoritoRepository.listarTodos();
  return [
    ...new Set(favoritos.filter((f) => normalizarGenero(f.nombre) === clave).map((f) => f.id_usuario)),
  ];
}

// Concierto nuevo: avisa a los que siguen al artista.
async function notificarSeguidores(concierto, artista) {
  const nombreArtista = artista.nombre;
  const seguidores = await seguidoresDe(artista);

  await backofficeRepository.crearNotificaciones(
    seguidores.map((idUsuario) => ({
      id_usuario: idUsuario,
      tipo: "novedad_concierto",
      titulo: `¡${nombreArtista} tiene un concierto nuevo!`,
      descripcion: `Se anunció ${concierto.nombre}. Entrá para ver los detalles y unirte.`,
      imagen: concierto.imagenConcierto || "",
      id_concierto: concierto.id_concierto,
    }))
  );
  return seguidores.length;
}

// Crea el concierto (y el artista si no existe) y avisa a sus seguidores.
// El concierto ya quedó creado: si falla el aviso no se deshace.
async function crearYAvisar({ artista, artista_spotify_id, ...datos }) {
  const filaArtista = await backofficeRepository.obtenerOCrearArtista(artista, artista_spotify_id);
  const concierto = await backofficeRepository.crearConcierto({
    ...datos,
    id_artista: filaArtista.id_artista,
  });

  let notificados = 0;
  try {
    notificados = await notificarSeguidores(concierto, filaArtista);
  } catch (error) {
    console.error("No se pudo avisar a los seguidores del artista:", error);
  }
  return { concierto, notificados };
}

const MAXIMO_IMPORTACION = 200;

// Valida cada fila de una importación en lote contra la base, sin crear
// nada. Cada fila vuelve con sus errores y, si no tiene, con los datos
// listos para crearConcierto. Los estadios y géneros no se crean acá:
// tienen que existir (se cargan por SQL).
async function revisarImportacion(texto) {
  const filas = leerFilas(texto);
  if (filas.length === 0) {
    throw ApiError.badRequest("No encontré conciertos en lo que pegaste");
  }
  if (filas.length > MAXIMO_IMPORTACION) {
    throw ApiError.badRequest(`Se pueden importar hasta ${MAXIMO_IMPORTACION} conciertos por vez`);
  }

  const [estadios, estilos, existentes] = await Promise.all([
    backofficeRepository.listarEstadios(),
    estiloMusicalRepository.listarCatalogo(),
    backofficeRepository.listarConciertos(),
  ]);
  const porNombre = (lista) => new Map(lista.map((x) => [normalizarGenero(x.nombre), x]));
  const estadioPorNombre = porNombre(estadios);
  const estiloPorNombre = porNombre(estilos);
  const yaCargados = new Set(existentes.map((c) => claveConcierto(c.nombre, c.fecha)));
  const primeraFilaDe = new Map();

  // Cada URL se prueba una sola vez, todas a la vez.
  const urls = [...new Set(filas.map((f) => f.imagen).filter(esUrlHttp))];
  const problemaDe = new Map(await Promise.all(urls.map(async (url) => [url, await problemaConImagen(url)])));

  return filas.map((f) => {
    const errores = [];
    const estadio = estadioPorNombre.get(normalizarGenero(f.estadio));
    const estilo = estiloPorNombre.get(normalizarGenero(f.genero));
    const fecha = leerFechaHora(f.fecha, f.hora);
    const fechaValida = typeof fecha === "string";

    if (!f.nombre) errores.push("Falta el nombre");
    else if (f.nombre.length > 150) errores.push("El nombre es muy largo (máximo 150 caracteres)");

    if (!f.artista) errores.push("Falta el artista");
    else if (f.artista.length > 150) errores.push("El artista es muy largo (máximo 150 caracteres)");

    if (!f.estadio) errores.push("Falta el estadio");
    else if (!estadio) errores.push(`No existe el estadio "${f.estadio}"`);

    if (!f.genero) errores.push("Falta el género");
    else if (!estilo) errores.push(`No existe el género "${f.genero}"`);

    if (!f.fecha) errores.push("Falta la fecha");
    else if (!fecha) errores.push(`Fecha inválida: "${`${f.fecha} ${f.hora}`.trim()}"`);
    else if (fecha.sinHora) errores.push("Falta la hora");
    else if (conciertoYaPaso(fecha)) errores.push("La fecha ya pasó");

    if (!f.imagen) errores.push("Falta la imagen");
    else if (!esUrlHttp(f.imagen)) errores.push("La imagen tiene que ser una URL (https://...)");
    else if (problemaDe.get(f.imagen)) errores.push(problemaDe.get(f.imagen));

    if (f.nombre && fechaValida) {
      const clave = claveConcierto(f.nombre, fecha);
      if (yaCargados.has(clave)) {
        errores.push("Ya existe un concierto con ese nombre ese día");
      } else if (primeraFilaDe.has(clave)) {
        errores.push(`Repetido: es igual a la fila ${primeraFilaDe.get(clave)}`);
      } else {
        primeraFilaDe.set(clave, f.fila);
      }
    }

    return {
      fila: f.fila,
      nombre: f.nombre,
      artista: f.artista,
      // Con el nombre como está en la base, para que se vea qué se eligió.
      estadio: estadio?.nombre || f.estadio,
      genero: estilo?.nombre || f.genero,
      fecha: fechaValida ? fecha : `${f.fecha} ${f.hora}`.trim(),
      imagen: f.imagen,
      errores,
      datos:
        errores.length === 0
          ? {
              nombre: f.nombre,
              artista: f.artista,
              id_estadio: estadio.id_estadio,
              id_estiloMusical: estilo.id,
              fecha,
              imagenConcierto: f.imagen,
            }
          : null,
    };
  });
}

const diasEntre = (a, b) => Math.abs(Date.parse(`${a}T12:00:00Z`) - Date.parse(`${b}T12:00:00Z`)) / 86_400_000;

// El concierto de un grupo importado: por id o por nombre. Varios shows
// pueden llamarse igual (una gira con varias fechas): se queda con el que
// cae a un día o menos del grupo. Devuelve { concierto } o { error }.
function buscarConciertoDeGrupo(texto, conciertos, diaGrupo) {
  if (/^\d+$/.test(texto)) {
    const concierto = conciertos.find((c) => String(c.id_concierto) === texto);
    return concierto ? { concierto } : { error: `No existe el concierto con id ${texto}` };
  }

  const clave = normalizarGenero(texto);
  let candidatos = conciertos.filter((c) => normalizarGenero(c.nombre) === clave);
  if (candidatos.length === 0) return { error: `No existe el concierto "${texto}"` };
  if (candidatos.length > 1) {
    candidatos = candidatos.filter((c) => !conciertoYaPaso(c.fecha));
    if (diaGrupo) candidatos = candidatos.filter((c) => diasEntre(String(c.fecha).slice(0, 10), diaGrupo) <= 1);
  }
  if (candidatos.length === 1) return { concierto: candidatos[0] };
  return { error: `Hay varios conciertos "${texto}": poné el id del concierto en vez del nombre` };
}

// Igual que revisarImportacion, para grupos. Cada fila vuelve con sus
// errores y, si no tiene, con los datos listos para crearGrupo.
async function revisarImportacionGrupos(texto) {
  const filas = leerFilasGrupos(texto);
  if (filas.length === 0) {
    throw ApiError.badRequest("No encontré grupos en lo que pegaste");
  }
  if (filas.length > MAXIMO_IMPORTACION) {
    throw ApiError.badRequest(`Se pueden importar hasta ${MAXIMO_IMPORTACION} grupos por vez`);
  }

  const [conciertos, existentes] = await Promise.all([
    backofficeRepository.listarConciertos(),
    backofficeRepository.listarGrupos(),
  ]);
  const yaCargados = new Set(existentes.map((g) => claveGrupo(g.nombre, g.id_concierto)));
  const primeraFilaDe = new Map();

  const urls = [...new Set(filas.map((f) => f.foto).filter(esUrlHttp))];
  const problemaDe = new Map(await Promise.all(urls.map(async (url) => [url, await problemaConImagen(url)])));

  return filas.map((f) => {
    const errores = [];
    const fecha = leerFechaHora(f.fecha, f.hora);
    const fechaValida = typeof fecha === "string";
    const categoria = leerCategoria(f.categoria);
    const sinEncuentro = categoria === CATEGORIA_COMUNIDAD;
    const cupo = f.cupo ? Number(f.cupo) : null;
    // "69+70+71" = grupo general de esas fechas (tienen que ser seguidas).
    const partes = f.concierto.split("+").map((p) => p.trim()).filter(Boolean);
    let { concierto, error: errorConcierto } = partes.length
      ? buscarConciertoDeGrupo(partes[0], conciertos, fechaValida ? fecha.slice(0, 10) : null)
      : { error: "Falta el concierto" };
    let fechasDelGrupo = concierto ? [concierto] : [];
    if (concierto && partes.length > 1) {
      const ids = [...new Set(partes.map(Number))];
      fechasDelGrupo = fechasSeguidas(concierto, conciertos).filter((c) => ids.includes(c.id_concierto));
      if (partes.some((p) => !/^\d+$/.test(p)) || fechasDelGrupo.length !== ids.length) {
        errorConcierto = `"${f.concierto}" no son fechas seguidas del mismo artista y estadio (poné sus ids unidos con +)`;
      } else {
        concierto = fechasDelGrupo[0];
      }
    }

    if (!f.nombre) errores.push("Falta el nombre");
    else if (f.nombre.length > 100) errores.push("El nombre es muy largo (máximo 100 caracteres)");

    if (errorConcierto) errores.push(errorConcierto);
    else if (conciertoYaPaso(fechasDelGrupo.at(-1).fecha)) errores.push("El concierto ya pasó");

    if (!f.categoria) errores.push("Falta el tipo (Previa, After, Mismo día o Comunidad)");
    else if (!categoria) errores.push(`Tipo inválido: "${f.categoria}" (Previa, After, Mismo día o Comunidad)`);

    // Un grupo de comunidad no tiene encuentro: fecha y lugar se ignoran.
    if (!sinEncuentro) {
      if (!f.fecha) errores.push("Falta la fecha");
      else if (!fecha) errores.push(`Fecha inválida: "${`${f.fecha} ${f.hora}`.trim()}"`);
      else if (fecha.sinHora) errores.push("Falta la hora");
      else if (conciertoYaPaso(fecha)) errores.push("La fecha ya pasó");

      if (!f.ubicacion) errores.push("Falta el punto de encuentro");
      else if (f.ubicacion.length < 6) errores.push("El punto de encuentro debe tener al menos 6 caracteres");
      else if (f.ubicacion.length > 150) errores.push("El punto de encuentro es muy largo (máximo 150 caracteres)");
    }

    if (f.descripcion.length > 500) errores.push("La descripción es muy larga (máximo 500 caracteres)");

    if (cupo !== null && (!Number.isInteger(cupo) || cupo < CUPO_MINIMO || cupo > CUPO_MAXIMO)) {
      errores.push(`El cupo tiene que ser un número entre ${CUPO_MINIMO} y ${CUPO_MAXIMO} (vacío = sin límite)`);
    }

    if (f.foto && !esUrlHttp(f.foto)) errores.push("La foto tiene que ser una URL (https://...)");
    else if (f.foto && problemaDe.get(f.foto)) errores.push(problemaDe.get(f.foto));

    if (f.nombre && concierto) {
      const clave = claveGrupo(f.nombre, concierto.id_concierto);
      if (yaCargados.has(clave)) {
        errores.push("Ya existe un grupo con ese nombre en ese concierto");
      } else if (primeraFilaDe.has(clave)) {
        errores.push(`Repetido: es igual a la fila ${primeraFilaDe.get(clave)}`);
      } else {
        primeraFilaDe.set(clave, f.fila);
      }
    }

    return {
      fila: f.fila,
      nombre: f.nombre,
      // Con el nombre y la fecha como están en la base, para que se vea qué se eligió.
      concierto: concierto ? { nombre: concierto.nombre, fecha: concierto.fecha } : { nombre: f.concierto },
      cantidadFechas: fechasDelGrupo.length,
      categoria: categoria || f.categoria,
      fecha: sinEncuentro ? "" : fechaValida ? fecha : `${f.fecha} ${f.hora}`.trim(),
      ubicacion: sinEncuentro ? "" : f.ubicacion,
      cupo,
      foto: f.foto,
      errores,
      datos:
        errores.length === 0
          ? {
              nombre: f.nombre,
              id_concierto: concierto.id_concierto,
              ids_conciertos: fechasDelGrupo.map((c) => c.id_concierto),
              categoria,
              fecha: sinEncuentro ? null : fecha.slice(0, 10),
              hora: sinEncuentro ? null : fecha.slice(11, 16),
              ubicacion: sinEncuentro ? null : f.ubicacion,
              descripcion: f.descripcion,
              cupo,
              foto: f.foto,
            }
          : null,
    };
  });
}

const NOMBRES_CAMPO = {
  nombre: "el nombre",
  fecha: "la fecha y hora",
  id_estadio: "el estadio",
  imagenConcierto: "la imagen",
  id_estiloMusical: "el género",
  id_artista: "el artista",
};

export const backofficeService = {
  async resumen() {
    const [usuarios, suspendidos, reportesPendientes, conciertos, grupos] = await Promise.all([
      backofficeRepository.contar("usuario"),
      backofficeRepository.contar("usuario", { columna: "estado", valor: "suspendido" }),
      reporteRepository.contarPendientes(),
      backofficeRepository.contar("concierto"),
      backofficeRepository.contar("grupo"),
    ]);
    return { usuarios, suspendidos, reportesPendientes, conciertos, grupos };
  },

  // ---------- Usuarios ----------

  async listarUsuarios(filtros) {
    const filas = await backofficeRepository.listarUsuarios(filtros);
    return filas.map(resumenUsuario);
  },

  async detalleUsuario(idUsuario) {
    const usuario = await usuarioRepository.obtenerPorId(idUsuario);
    if (!usuario) throw ApiError.notFound("El usuario no existe");

    const [reportes, relacionesConcierto, relacionesGrupo] = await Promise.all([
      reporteRepository.listarDeUsuario(idUsuario),
      usuariosConciertosRepository.listarConciertosPorUsuario(idUsuario),
      grupoUsuarioRepository.listarGruposPorUsuario(idUsuario),
    ]);
    const [conciertos, grupos, reportesCompletos] = await Promise.all([
      Promise.all(relacionesConcierto.map((r) => conciertoRepository.obtenerPorId(r.id_concierto))),
      relacionesGrupo.length
        ? grupoRepository.listarPorIds(relacionesGrupo.map((r) => r.id_grupo))
        : [],
      completarReportes(reportes),
    ]);

    return {
      ...resumenUsuario(usuario),
      fechanac: usuario.fechanac,
      genero: usuario.genero,
      conciertos: conciertos.filter(Boolean).map((c) => ({ id_concierto: c.id_concierto, nombre: c.nombre })),
      grupos: grupos.map((g) => ({ id_grupo: g.id_grupo, nombre: g.nombre, id_concierto: g.id_concierto })),
      reportesRecibidos: reportesCompletos.filter((r) => r.id_reportado === idUsuario),
      reportesHechos: reportesCompletos.filter((r) => r.id_reportante === idUsuario),
    };
  },

  // Suspender = vetado de toda la app; reactivar lo vuelve a dejar entrar.
  async cambiarEstadoUsuario(idModerador, idUsuario, { estado, motivo }) {
    if (idModerador === idUsuario) {
      throw ApiError.badRequest("No podés cambiar el estado de tu propia cuenta");
    }
    const usuario = await usuarioRepository.obtenerPorId(idUsuario);
    if (!usuario) throw ApiError.notFound("El usuario no existe");
    if (estado === "suspendido" && usuario.rol === "moderador") {
      throw ApiError.badRequest("No se puede suspender a otro moderador");
    }

    const actualizado = await backofficeRepository.cambiarEstadoUsuario(idUsuario, { estado, motivo });
    olvidarEstadoUsuario(idUsuario);
    try {
      await backofficeRepository.banearEnAuth(idUsuario, estado === "suspendido");
    } catch (error) {
      // El estado en "usuario" ya alcanza para dejarlo afuera de la API.
      console.error(error.message);
    }
    return resumenUsuario(actualizado);
  },

  // ---------- Reportes ----------

  async listarReportes(filtros) {
    const reportes = await reporteRepository.listar(filtros);
    return completarReportes(reportes);
  },

  // El reporte con todo lo que pasó: si fue en un grupo, los últimos
  // mensajes del grupo; si no, el chat privado entre los dos.
  async detalleReporte(idReporte) {
    const reporte = await reporteRepository.obtenerPorId(idReporte);
    if (!reporte) throw ApiError.notFound("El reporte no existe");

    const [completo] = await completarReportes([reporte]);

    let filas;
    let campoAutor;
    if (reporte.id_grupo) {
      filas = await mensajeRepository.listarPorGrupo(reporte.id_grupo, { limite: MENSAJES_DE_CONTEXTO });
      campoAutor = "id_usuario";
    } else {
      filas = await mensajePrivadoRepository.listarConversacion(
        reporte.id_reportante,
        reporte.id_reportado,
        { limite: MENSAJES_DE_CONTEXTO }
      );
      campoAutor = "id_emisor";
    }
    const autores = await usuariosPorId(filas.map((m) => m[campoAutor]));

    const otrosReportes = (await reporteRepository.listarDeUsuario(reporte.id_reportado)).filter(
      (r) => r.id_reportado === reporte.id_reportado && r.id_reporte !== reporte.id_reporte
    );

    return {
      ...completo,
      contexto: {
        tipo: reporte.id_grupo ? "grupo" : "privado",
        mensajes: armarMensajes(filas, autores, campoAutor),
      },
      otrosReportesContraElUsuario: otrosReportes.length,
    };
  },

  // sancionar: suspende al usuario reportado. descartar: no pasa nada.
  async resolverReporte(idModerador, idReporte, { decision, resolucion }) {
    const reporte = await reporteRepository.obtenerPorId(idReporte);
    if (!reporte) throw ApiError.notFound("El reporte no existe");
    if (reporte.estado !== "pendiente") {
      throw ApiError.badRequest("Este reporte ya fue resuelto");
    }

    if (decision === "sancionar") {
      await backofficeService.cambiarEstadoUsuario(idModerador, reporte.id_reportado, {
        estado: "suspendido",
        motivo: resolucion || reporte.motivo,
      });
    }

    const resuelto = await reporteRepository.resolver(idReporte, {
      estado: decision === "sancionar" ? "sancionado" : "descartado",
      resolucion: resolucion || null,
      idModerador,
    });
    const [completo] = await completarReportes([resuelto]);
    return completo;
  },

  // ---------- Conciertos ----------

  async catalogo() {
    const [artistas, estadios, estilos] = await Promise.all([
      backofficeRepository.listarArtistas(),
      backofficeRepository.listarEstadios(),
      estiloMusicalRepository.listarCatalogo(),
    ]);
    return { artistas, estadios, estilos };
  },

  // Cada concierto trae sus fechas seguidas (ids, él incluido) para
  // elegir de cuáles es un grupo general.
  async listarConciertos() {
    const filas = await backofficeRepository.listarConciertos();
    return filas.map((fila) => ({
      ...toConciertoResumen(fila),
      fechasSeguidas: fechasSeguidas(fila, filas).map((c) => c.id_concierto),
    }));
  },

  // El artista se elige de Spotify o se escribe por nombre: si no existe, se crea.
  async crearConcierto(datos) {
    const { concierto } = await crearYAvisar(datos);
    return concierto;
  },

  // Vista previa de la importación en lote: no crea nada.
  async previaImportacion(texto) {
    const filas = await revisarImportacion(texto);
    return { filas: filas.map(({ datos: _datos, ...fila }) => fila) };
  },

  // Vuelve a validar todo (no se confía en la vista previa: la base pudo
  // cambiar) y crea solo las filas sin errores, de a una para que un
  // artista repetido se cree una sola vez.
  async importarConciertos(texto) {
    const filas = await revisarImportacion(texto);
    const creados = [];
    const fallidos = [];
    let notificados = 0;

    for (const fila of filas) {
      if (!fila.datos) continue;
      try {
        const resultado = await crearYAvisar({ ...fila.datos, artista_spotify_id: null });
        creados.push({ fila: fila.fila, id_concierto: resultado.concierto.id_concierto, nombre: fila.nombre });
        notificados += resultado.notificados;
      } catch (error) {
        fallidos.push({ fila: fila.fila, nombre: fila.nombre, error: error.message });
      }
    }

    const conErrores = filas.filter((f) => !f.datos).map(({ datos: _datos, ...fila }) => fila);
    return { creados, conErrores, fallidos, notificados };
  },

  // Cambiar datos de un concierto le avisa a sus fans (si son muchos).
  async actualizarConcierto(idConcierto, { artista, artista_spotify_id, ...cambios }) {
    const anterior = await conciertoRepository.obtenerPorId(idConcierto);
    if (!anterior) throw ApiError.notFound("El concierto no existe");

    if (artista) {
      const filaArtista = await backofficeRepository.obtenerOCrearArtista(artista, artista_spotify_id);
      cambios.id_artista = filaArtista.id_artista;
    }

    const actualizado = await backofficeRepository.actualizarConcierto(idConcierto, cambios);
    // La fecha se compara sin segundos ("2026-08-28T21:00" vs "...T21:00:00").
    const comparable = (campo, valor) =>
      campo === "fecha" ? String(valor ?? "").slice(0, 16) : String(valor ?? "");
    const cambiados = Object.keys(cambios).filter(
      (campo) => comparable(campo, cambios[campo]) !== comparable(campo, anterior[campo])
    );

    let aviso = { notificados: 0 };
    if (cambiados.length > 0) {
      const lista = cambiados.map((c) => NOMBRES_CAMPO[c] || c).join(", ");
      aviso = await notificarFans(actualizado, {
        titulo: actualizado.nombre,
        descripcion: `Hay cambios en este concierto: se actualizó ${lista}. Entrá para ver los detalles.`,
      });
    }
    return { concierto: actualizado, cambios: cambiados, aviso };
  },

  // Borra el concierto con sus grupos, chats y fans unidos. A los unidos les
  // avisa que se canceló (sin id_concierto: ya no hay a dónde llevarlos).
  async eliminarConcierto(idConcierto) {
    const concierto = await conciertoRepository.obtenerPorId(idConcierto);
    if (!concierto) throw ApiError.notFound("El concierto no existe");

    const unidos = await usuariosConciertosRepository.listarUsuariosPorConcierto(idConcierto);
    const grupos = await grupoRepository.listarPorConcierto(idConcierto);

    // Un grupo general sigue con las otras fechas: solo se le saca esta.
    const generales = grupos.filter(esGrupoGeneral);
    for (const grupo of generales) {
      const quedan = conciertosDelGrupo(grupo).filter((id) => id !== Number(idConcierto));
      await grupoRepository.actualizar(grupo.id_grupo, {
        id_concierto: quedan[0],
        ids_conciertos: quedan.length > 1 ? quedan : null,
      });
    }

    await backofficeRepository.eliminarConcierto(idConcierto);
    await borrarFotosDeGrupos(grupos.filter((g) => !esGrupoGeneral(g)).map((g) => g.id_grupo));

    try {
      await backofficeRepository.crearNotificaciones(
        unidos.map((u) => ({
          id_usuario: u.id_usuario,
          tipo: "novedad_concierto",
          titulo: `Se canceló ${concierto.nombre}`,
          descripcion: "El concierto se dio de baja, junto con sus grupos.",
          imagen: concierto.imagenConcierto || "",
        }))
      );
    } catch (error) {
      console.error("No se pudo avisar la baja del concierto:", error);
    }
    return { ok: true, notificados: unidos.length };
  },

  async publicarNovedad(idConcierto, { titulo, descripcion }) {
    const concierto = await conciertoRepository.obtenerPorId(idConcierto);
    if (!concierto) throw ApiError.notFound("El concierto no existe");
    const aviso = await notificarFans(concierto, {
      titulo: `${concierto.nombre}: ${titulo}`,
      descripcion,
    });
    return { aviso };
  },

  // ---------- Grupos ----------

  async listarGrupos() {
    const filas = await backofficeRepository.listarGrupos();
    return filas.map(({ concierto, grupos_usuarios, mensaje_grupo, ...g }) => ({
      ...g,
      concierto: concierto?.nombre || "",
      cantidadFechas: conciertosDelGrupo(g).length,
      cantidadIntegrantes: grupos_usuarios?.[0]?.count ?? 0,
      cantidadMensajes: mensaje_grupo?.[0]?.count ?? 0,
    }));
  },

  // A diferencia de un fan, el moderador no necesita estar unido al
  // concierto ni queda como integrante: el grupo arranca vacío y los fans se
  // suman. Queda como id_creador, así que solo él podría eliminarlo.
  async crearGrupo(idModerador, { foto, ids_conciertos: idsPedidos, ...datos }) {
    const concierto = await conciertoRepository.obtenerPorId(datos.id_concierto);
    if (!concierto) throw ApiError.notFound("El concierto no existe");

    return grupoRepository.crear({
      ...datos,
      ...(await prepararConciertosDelGrupo(concierto, idsPedidos)),
      ...(foto ? { foto } : {}),
      id_creador: idModerador,
    });
  },

  async previaImportacionGrupos(texto) {
    const filas = await revisarImportacionGrupos(texto);
    return { filas: filas.map(({ datos: _datos, ...fila }) => fila) };
  },

  // Como importarConciertos: revalida todo y crea solo las filas sin errores.
  async importarGrupos(idModerador, texto) {
    const filas = await revisarImportacionGrupos(texto);
    const creados = [];
    const fallidos = [];

    for (const fila of filas) {
      if (!fila.datos) continue;
      try {
        const grupo = await this.crearGrupo(idModerador, fila.datos);
        creados.push({ fila: fila.fila, id_grupo: grupo.id_grupo, nombre: fila.nombre });
      } catch (error) {
        fallidos.push({ fila: fila.fila, nombre: fila.nombre, error: error.message });
      }
    }

    const conErrores = filas.filter((f) => !f.datos).map(({ datos: _datos, ...fila }) => fila);
    return { creados, conErrores, fallidos };
  },

  // Cambiar el concierto o las fechas (ids_conciertos) vuelve a armar las
  // fechas del grupo desde el concierto elegido.
  async actualizarGrupo(idGrupo, { foto, ids_conciertos: idsPedidos, ...cambios }) {
    const grupo = await grupoRepository.obtenerPorId(idGrupo);
    if (!grupo) throw ApiError.notFound("El grupo no existe");
    if (cambios.id_concierto || idsPedidos) {
      const concierto = await conciertoRepository.obtenerPorId(cambios.id_concierto || grupo.id_concierto);
      if (!concierto) throw ApiError.notFound("El concierto no existe");
      Object.assign(cambios, await prepararConciertosDelGrupo(concierto, idsPedidos));
    }
    await validarCupoNuevo(idGrupo, cambios.cupo);

    const actualizado = await grupoRepository.actualizar(idGrupo, {
      ...cambiosConEncuentro(grupo, cambios),
      ...(foto !== undefined ? { foto: foto || null } : {}),
    });
    // El moderador no es integrante: se les avisa a todos.
    const notificados = await avisarCambiosDeGrupo(grupo, actualizado);
    return { grupo: actualizado, notificados };
  },

  // Borra el grupo con sus integrantes, mensajes y fotos del chat. A los
  // integrantes les avisa (sin id_grupo: ya no hay a dónde llevarlos).
  async eliminarGrupo(idGrupo) {
    const grupo = await grupoRepository.obtenerPorId(idGrupo);
    if (!grupo) throw ApiError.notFound("El grupo no existe");

    const integrantes = await grupoUsuarioRepository.listarUsuariosPorGrupo(idGrupo);
    await backofficeRepository.eliminarGrupos([grupo.id_grupo]);
    await borrarFotosDeGrupos([grupo.id_grupo]);

    const destinatarios = [...new Set(integrantes.map((i) => i.id_usuario))];
    try {
      await backofficeRepository.crearNotificaciones(
        destinatarios.map((idUsuario) => ({
          id_usuario: idUsuario,
          tipo: "cambio_grupo",
          titulo: `Se eliminó el grupo ${grupo.nombre}`,
          descripcion: "Un moderador dio de baja el grupo junto con su chat.",
          imagen: grupo.foto || "",
        }))
      );
    } catch (error) {
      console.error("No se pudo avisar la baja del grupo:", error);
    }
    return { ok: true, notificados: destinatarios.length };
  },

  async mensajesDeGrupo(idGrupo) {
    const grupo = await grupoRepository.obtenerPorId(idGrupo);
    if (!grupo) throw ApiError.notFound("El grupo no existe");
    const filas = await mensajeRepository.listarPorGrupo(idGrupo, { limite: 200 });
    const autores = await usuariosPorId(filas.map((m) => m.id_usuario));
    return { grupo, mensajes: armarMensajes(filas, autores, "id_usuario") };
  },
};
