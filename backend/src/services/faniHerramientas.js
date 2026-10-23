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

// Herramientas de Fani (function calling de Gemini). La privacidad se
// resuelve acá, no en el prompt: solo se ven grupos de conciertos a los que
// el usuario está unido, nunca datos de otros usuarios (solo cuántos son) y
// no aparecen grupos creados por alguien con quien hay un bloqueo.
// Fani no hace acciones: "proponer_unirse_a_grupo" solo deja una propuesta
// que el usuario confirma con un botón (ver chatbotService.resolverAccion).

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
    name: "proponer_unirse_a_grupo",
    description:
      "Le muestra al usuario los botones Confirmar y Cancelar para sumarse a un grupo. NO lo suma: se suma recién cuando él toca Confirmar. Usala solo cuando el usuario pidió sumarse a un grupo concreto.",
    parameters: {
      type: "object",
      properties: {
        id_grupo: { type: "integer", description: "id_grupo del grupo, sacado de los datos o de una búsqueda." },
      },
      required: ["id_grupo"],
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

async function proponerUnirseAGrupo(idUsuario, { id_grupo }) {
  try {
    const { grupo, concierto } = await validarUnionAGrupo(idUsuario, Number(id_grupo));
    return {
      respuesta: {
        ok: true,
        aviso:
          "Se le mostraron al usuario los botones Confirmar y Cancelar. Todavía NO está en el grupo: decile que toque Confirmar si quiere sumarse.",
      },
      accion: {
        tipo: "unirse_grupo",
        estado: "pendiente",
        id_grupo: grupo.id_grupo,
        grupo: grupo.nombre,
        concierto: concierto?.nombre || "",
      },
    };
  } catch (error) {
    if (error instanceof ApiError) return { respuesta: { error: error.message } };
    throw error;
  }
}

// Ejecuta lo que pidió la IA. Devuelve { respuesta } para mandarle a la IA
// y, si corresponde, la { accion } que el usuario tiene que confirmar.
export async function ejecutarHerramienta(idUsuario, nombre, args = {}) {
  switch (nombre) {
    case "buscar_grupos_con_lugar":
      return { respuesta: await buscarGruposConLugar(idUsuario, args) };
    case "mis_grupos_y_proximos_eventos":
      return { respuesta: await misGruposYProximosEventos(idUsuario) };
    case "proponer_unirse_a_grupo":
      return proponerUnirseAGrupo(idUsuario, args);
    default:
      return { respuesta: { error: `No existe la herramienta ${nombre}` } };
  }
}
