import {
  conciertoRepository,
  usuariosConciertosRepository,
} from "../repositories/conciertoRepository.js";
import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { sinBloqueados } from "./bloqueoService.js";
import { conciertoYaPaso, hoyEnArgentina } from "../helpers/fechas.js";
import { ApiError } from "../helpers/ApiError.js";
import { conciertosDelGrupo, esGrupoGeneral } from "../helpers/gruposGenerales.js";
import { perteneceAlConciertoDelGrupo } from "./grupoService.js";

// Herramientas de Fani (function calling de la IA, ver chatbotService). La privacidad se
// resuelve acá, no en el prompt: solo se ven grupos de conciertos a los que
// el usuario está unido, nunca datos de otros usuarios (solo cuántos son) y
// no aparecen grupos creados por alguien con quien hay un bloqueo.
// Fani no hace acciones: "mostrar_grupos" y "mostrar_conciertos" solo dejan
// tarjetas con un botón Unirme que toca el usuario (ver
// chatbotService.resolverAccion). Para un concierto, la tarjeta le pide el
// código de acceso: Fani nunca lo sabe.

// Cuántas tarjetas de grupos (y cuántas de conciertos) puede mostrar Fani en un mensaje.
const MAXIMO_TARJETAS = 3;

export const NOMBRES_CATEGORIA_GRUPO = {
  pre: "Previa (antes del concierto)",
  after: "After (después del concierto)",
  mismo_dia: "Mismo día",
  comunidad: "Comunidad (sin encuentro, para charlar entre los que van)",
};

export const DECLARACIONES = [
  {
    name: "buscar_grupos_con_lugar",
    description:
      "Busca grupos con lugar libre, de los conciertos a los que el usuario está unido y que todavía no pasaron, en los que el usuario todavía no está.",
    parameters: {
      type: "object",
      properties: {
        id_concierto: {
          type: "integer",
          description: "Para buscar solo en un concierto (id_concierto de los datos). Si no, busca en todos.",
        },
        tipo: {
          type: "string",
          enum: ["pre", "after", "mismo_dia", "comunidad"],
          description:
            "pre = previa, after = después del show, mismo_dia = el mismo día, comunidad = sin encuentro, para charlar.",
        },
      },
    },
  },
  {
    name: "mis_grupos_y_proximos_eventos",
    description:
      "Devuelve los próximos conciertos a los que el usuario está unido y los grupos en los que está, con fecha, hora y punto de encuentro.",
  },
  {
    name: "mostrar_grupos",
    description:
      "Muestra debajo de tu mensaje una tarjeta por grupo (tipo, concierto, fecha, punto de encuentro, lugares) con un botón Unirme. NO suma al usuario: se suma recién cuando él toca Unirme. Usala cada vez que le recomiendes grupos o te pida sumarse a uno.",
    parameters: {
      type: "object",
      properties: {
        ids_grupo: {
          type: "array",
          items: { type: "integer" },
          maxItems: MAXIMO_TARJETAS,
          description: `id_grupo de los grupos (de los datos o de una búsqueda), hasta ${MAXIMO_TARJETAS}.`,
        },
      },
      required: ["ids_grupo"],
    },
  },
  {
    name: "mostrar_conciertos",
    description:
      "Muestra debajo de tu mensaje una tarjeta por concierto (artista, fecha, estadio) con un campo para el código de acceso y un botón Unirme. NO suma al usuario: se suma recién cuando escribe el código y toca Unirme. Usala cada vez que le recomiendes conciertos o te pida unirse a uno.",
    parameters: {
      type: "object",
      properties: {
        ids_concierto: {
          type: "array",
          items: { type: "integer" },
          maxItems: MAXIMO_TARJETAS,
          description: `id_concierto de los conciertos (de los datos), hasta ${MAXIMO_TARJETAS}.`,
        },
      },
      required: ["ids_concierto"],
    },
  },
];

const fechaDe = (c) => (c.fecha ? String(c.fecha).slice(0, 10) : "a confirmar");
const horaDe = (c) => (c.fecha && String(c.fecha).length > 10 ? String(c.fecha).slice(11, 16) : "a confirmar");
const horaGrupo = (g) => (g.hora ? String(g.hora).slice(0, 5) : "a confirmar");

// Lo que el usuario puede ver: sus conciertos y los grupos de esos conciertos.
async function cargarLoVisible(idUsuario) {
  const [conciertos, relaciones, misRelaciones] = await Promise.all([
    conciertoRepository.listarTodos(),
    usuariosConciertosRepository.listarConciertosPorUsuario(idUsuario),
    grupoUsuarioRepository.listarGruposPorUsuario(idUsuario),
  ]);
  const idsUnidos = new Set(relaciones.map((r) => r.id_concierto));
  const unidos = conciertos.filter((c) => idsUnidos.has(c.id_concierto));
  const conciertoPorId = new Map(unidos.map((c) => [c.id_concierto, c]));

  const gruposPorConcierto = await Promise.all(unidos.map((c) => grupoRepository.listarPorConcierto(c.id_concierto)));
  // Un grupo general aparece en cada una de sus fechas: va una sola vez.
  const sinRepetir = [...new Map(gruposPorConcierto.flat().map((g) => [g.id_grupo, g])).values()];
  const grupos = await sinBloqueados(idUsuario, sinRepetir, "id_creador");
  const miembros = await grupoUsuarioRepository.listarUsuariosPorGrupos(grupos.map((g) => g.id_grupo));
  const integrantes = (idGrupo) => miembros.filter((m) => m.id_grupo === idGrupo).length;

  return {
    unidos,
    conciertoPorId,
    // El concierto de un grupo que el usuario ve: el suyo, si es general.
    conciertoDe: (g) => conciertosDelGrupo(g).map((id) => conciertoPorId.get(id)).find(Boolean),
    grupos,
    integrantes,
    misGrupos: new Set(misRelaciones.map((r) => r.id_grupo)),
  };
}

function resumirGrupo(g, concierto, integrantes) {
  return {
    id_grupo: g.id_grupo,
    nombre: g.nombre,
    tipo: NOMBRES_CATEGORIA_GRUPO[g.categoria] || g.categoria,
    concierto: concierto?.nombre,
    ...(esGrupoGeneral(g) ? { de_todas_las_fechas: conciertosDelGrupo(g).length } : {}),
    fecha: g.fecha,
    hora: horaGrupo(g),
    punto_de_encuentro: g.ubicacion,
    descripcion: g.descripcion || "",
    integrantes,
    lugares_libres: g.cupo ? Math.max(g.cupo - integrantes, 0) : "sin límite",
  };
}

const grupoVigente = (g) => !g.fecha || String(g.fecha).slice(0, 10) >= hoyEnArgentina();

async function buscarGruposConLugar(idUsuario, { id_concierto, tipo } = {}) {
  const visible = await cargarLoVisible(idUsuario);
  if (id_concierto && !visible.conciertoPorId.has(Number(id_concierto))) {
    return {
      error:
        "El usuario no está unido a ese concierto: sus grupos son privados. Puede unirse desde el Inicio con el código de acceso.",
    };
  }

  const grupos = visible.grupos
    .filter((g) => !id_concierto || conciertosDelGrupo(g).includes(Number(id_concierto)))
    .filter((g) => !tipo || g.categoria === tipo)
    .filter((g) => !visible.misGrupos.has(g.id_grupo))
    .filter((g) => !conciertoYaPaso(visible.conciertoDe(g)?.fecha) && grupoVigente(g))
    .filter((g) => !g.cupo || visible.integrantes(g.id_grupo) < g.cupo)
    .map((g) => resumirGrupo(g, visible.conciertoDe(g), visible.integrantes(g.id_grupo)));

  return { grupos };
}

async function misGruposYProximosEventos(idUsuario) {
  const visible = await cargarLoVisible(idUsuario);
  const proximos = visible.unidos
    .filter((c) => c.fecha && !conciertoYaPaso(c.fecha))
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

  // Los grupos propios van siempre, aunque el creador tenga un bloqueo con
  // el usuario: bloquear no cambia los grupos que ya comparten.
  const ids = [...visible.misGrupos];
  const misGrupos = ids.length > 0 ? await grupoRepository.listarPorIds(ids) : [];
  const miembros = await grupoUsuarioRepository.listarUsuariosPorGrupos(ids);

  return {
    proximos_conciertos: proximos.map((c) => ({
      id_concierto: c.id_concierto,
      nombre: c.nombre,
      artista: c.artista?.nombre,
      fecha: fechaDe(c),
      hora: horaDe(c),
      estadio: c.estadio?.nombre,
      ciudad: c.estadio?.ciudad,
    })),
    mis_grupos: misGrupos
      .filter(grupoVigente)
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
      .map((g) => ({
        ...resumirGrupo(
          g,
          visible.conciertoDe(g),
          miembros.filter((m) => m.id_grupo === g.id_grupo).length
        ),
        lo_creo_el_usuario: g.id_creador === idUsuario,
      })),
  };
}

// Mismas reglas al proponer y al confirmar. Tira ApiError con un mensaje
// que se le puede mostrar al usuario (o pasar a Fani).
export async function validarUnionAGrupo(idUsuario, idGrupo) {
  const grupo = await grupoRepository.obtenerPorId(idGrupo);
  // Un grupo creado por alguien con bloqueo es como si no existiera.
  const visibles = grupo ? await sinBloqueados(idUsuario, [grupo], "id_creador") : [];
  if (visibles.length === 0) throw ApiError.notFound("Ese grupo no existe");

  const estaEnElConcierto = await perteneceAlConciertoDelGrupo(idUsuario, grupo);
  if (!estaEnElConcierto) {
    throw ApiError.forbidden(
      "No estás unido al concierto de ese grupo. Podés unirte desde el Inicio con el código de acceso."
    );
  }
  if (await grupoUsuarioRepository.existeRelacion(idUsuario, idGrupo)) {
    throw new ApiError(409, "Ya estás en ese grupo");
  }
  // Un grupo general pasa cuando pasó su última fecha.
  const concierto = await conciertoRepository.obtenerPorId(conciertosDelGrupo(grupo).at(-1));
  if (conciertoYaPaso(concierto?.fecha) || !grupoVigente(grupo)) {
    throw new ApiError(409, "Ese grupo ya pasó");
  }
  if (grupo.cupo) {
    const integrantes = await grupoUsuarioRepository.listarUsuariosPorGrupo(idGrupo);
    if (integrantes.length >= grupo.cupo) throw new ApiError(409, "El grupo está completo");
  }
  return { grupo, concierto };
}

// Los ids que pidió la IA, sin repetir y como mucho MAXIMO_TARJETAS.
function idsPedidos(ids) {
  return [...new Set((Array.isArray(ids) ? ids : [ids]).map(Number))]
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, MAXIMO_TARJETAS);
}

// Lo que muestra la tarjeta del grupo en el chat con Fani.
async function tarjetaDeGrupo(idUsuario, idGrupo) {
  const { grupo, concierto } = await validarUnionAGrupo(idUsuario, idGrupo);
  const integrantes = await grupoUsuarioRepository.listarUsuariosPorGrupo(idGrupo);
  return {
    id_grupo: grupo.id_grupo,
    nombre: grupo.nombre,
    categoria: grupo.categoria,
    concierto: concierto?.nombre || "",
    fecha: grupo.fecha ? String(grupo.fecha).slice(0, 10) : fechaDe(concierto ?? {}),
    hora: grupo.hora ? horaGrupo(grupo) : null,
    punto_de_encuentro: grupo.ubicacion || "",
    integrantes: integrantes.length,
    cupo: grupo.cupo || null,
    unido: false,
  };
}

async function mostrarGrupos(idUsuario, { ids_grupo } = {}) {
  const ids = idsPedidos(ids_grupo);

  const tarjetas = [];
  const errores = [];
  for (const id of ids) {
    try {
      tarjetas.push(await tarjetaDeGrupo(idUsuario, id));
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      errores.push({ id_grupo: id, error: error.message });
    }
  }

  if (tarjetas.length === 0) {
    return { respuesta: { error: errores[0]?.error || "No hay grupos para mostrar", errores } };
  }
  return {
    respuesta: {
      ok: true,
      mostrados: tarjetas.map((t) => t.nombre),
      ...(errores.length > 0 ? { no_se_pudieron_mostrar: errores } : {}),
      aviso:
        "El usuario ya ve una tarjeta por grupo con todos los datos y un botón Unirme. Todavía NO está en ningún grupo. No repitas los datos de las tarjetas: respondé corto y decile que toque Unirme en el que quiera.",
    },
    accion: { tipo: "tarjetas", estado: "pendiente", grupos: tarjetas, conciertos: [] },
  };
}

// Conciertos de la app que todavía no pasaron. Los ya unidos también se
// muestran (con "Ver concierto" en vez de Unirme).
async function mostrarConciertos(idUsuario, { ids_concierto } = {}) {
  const ids = idsPedidos(ids_concierto);
  const [conciertos, relaciones] = await Promise.all([
    conciertoRepository.listarTodos(),
    usuariosConciertosRepository.listarConciertosPorUsuario(idUsuario),
  ]);
  const unidos = new Set(relaciones.map((r) => r.id_concierto));

  const tarjetas = [];
  const errores = [];
  for (const id of ids) {
    const c = conciertos.find((x) => x.id_concierto === id);
    if (!c) errores.push({ id_concierto: id, error: "Ese concierto no existe" });
    else if (conciertoYaPaso(c.fecha)) errores.push({ id_concierto: id, error: "Ese concierto ya pasó" });
    else {
      tarjetas.push({
        id_concierto: c.id_concierto,
        nombre: c.nombre,
        artista: c.artista?.nombre || "",
        fecha: fechaDe(c),
        hora: c.fecha && String(c.fecha).length > 10 ? horaDe(c) : null,
        estadio: c.estadio?.nombre || "",
        ciudad: c.estadio?.ciudad || "",
        imagen: c.imagen || c.imagenConcierto || c.foto || "",
        fans_unidos: c.usuarios_conciertos?.[0]?.count ?? 0,
        unido: unidos.has(c.id_concierto),
      });
    }
  }

  if (tarjetas.length === 0) {
    return { respuesta: { error: errores[0]?.error || "No hay conciertos para mostrar", errores } };
  }
  return {
    respuesta: {
      ok: true,
      mostrados: tarjetas.map((t) => ({ nombre: t.nombre, ya_esta_unido: t.unido })),
      ...(errores.length > 0 ? { no_se_pudieron_mostrar: errores } : {}),
      aviso:
        "El usuario ya ve una tarjeta por concierto con los datos. En los que no está unido hay un campo para el código de acceso y un botón Unirme. No repitas los datos de las tarjetas: respondé corto y decile que escriba el código y toque Unirme.",
    },
    accion: { tipo: "tarjetas", estado: "pendiente", grupos: [], conciertos: tarjetas },
  };
}

// Ejecuta lo que pidió la IA. Devuelve { respuesta } para mandarle a la IA
// y, si corresponde, la { accion } que el usuario tiene que confirmar.
export async function ejecutarHerramienta(idUsuario, nombre, args = {}) {
  switch (nombre) {
    case "buscar_grupos_con_lugar":
      return { respuesta: await buscarGruposConLugar(idUsuario, args) };
    case "mis_grupos_y_proximos_eventos":
      return { respuesta: await misGruposYProximosEventos(idUsuario) };
    case "mostrar_grupos":
      return mostrarGrupos(idUsuario, args);
    case "mostrar_conciertos":
      return mostrarConciertos(idUsuario, args);
    default:
      return { respuesta: { error: `No existe la herramienta ${nombre}` } };
  }
}
