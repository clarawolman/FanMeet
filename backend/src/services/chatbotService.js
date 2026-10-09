import Anthropic from "@anthropic-ai/sdk";
import { mensajeChatbotRepository } from "../repositories/mensajeChatbotRepository.js";
import {
  conciertoRepository,
  usuariosConciertosRepository,
} from "../repositories/conciertoRepository.js";
import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { toMensajeChatbot } from "../entities/MensajeChatbot.js";
import { ApiError } from "../helpers/ApiError.js";

const MODELO = "claude-opus-5-5";
// Cuántos mensajes anteriores del chat se le pasan a la IA como memoria.
const MENSAJES_DE_HISTORIAL = 30;
const MAIL_QUEJAS = "fanmeet100@gmail.com";

const NOMBRES_CATEGORIA_GRUPO = {
  pre: "Previa (antes del concierto)",
  after: "After (después del concierto)",
  mismo_dia: "Mismo día",
};

const INSTRUCCIONES = `Sos Fani, la asistente virtual de la app FanMeet (tu logo es un robotito violeta que saluda). FanMeet conecta fans que van al mismo concierto: cada usuario se une a un concierto con un código de acceso y, una vez adentro, puede ver a los otros fans unidos, armar o sumarse a grupos (previa, after o mismo día), y chatear con sus amigos y con sus grupos.

Tu trabajo:
- Responder sobre los próximos conciertos de cada categoría (género musical): artista, fecha, hora, estadio, ciudad, cuántos fans y grupos tiene.
- Si el usuario está unido a un concierto, también podés contarle sobre los grupos de ese concierto.
- Ayudar con cómo usar la app: unirse a un concierto con el código, crear o sumarse a un grupo, agregar amigos, chatear, editar el perfil y los géneros favoritos.

Privacidad (muy importante):
- Solo tenés datos de grupos de los conciertos a los que el usuario está unido. Si pregunta por los grupos de un concierto al que no se unió, explicale que esa información es privada para quienes se unieron y que puede unirse desde el Inicio con el código de acceso del concierto. No inventes ni adivines grupos.
- Nunca reveles el código de acceso de un concierto (no lo tenés).

Reglas:
- Usá solo la información de <datos_fanmeet>. Si algo no está ahí, decí que no lo sabés en vez de inventarlo.
- Si el usuario tiene un problema que no podés resolver, quiere hacer un reclamo, reportar a alguien o un error de la app, ofrecele mandar un mail de queja a ${MAIL_QUEJAS} contando qué pasó.
- Hablá en español rioplatense, con voseo, en tono amigable y cercano. Respuestas cortas, como en un chat de WhatsApp: texto plano, sin títulos ni tablas ni markdown; podés usar algún emoji.
- Si te preguntan algo que no tiene nada que ver con FanMeet o la música en vivo, respondé brevemente y volvé a ofrecer ayuda con la app.`;

let cliente = null;

function obtenerCliente() {
  if (!cliente) {
    try {
      cliente = new Anthropic();
    } catch {
      throw new ApiError(503, "El chatbot todavía no está configurado (falta ANTHROPIC_API_KEY)");
    }
  }
  return cliente;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function nombreDeEstilo(estilo) {
  return estilo.nombre ?? estilo.nombre_estilo ?? estilo.genero ?? "Sin categoría";
}

function idDeEstilo(estilo) {
  return estilo.id_estilo ?? estilo.id ?? estilo.id_estilo_musical;
}

function resumirConcierto(fila, nombresEstilo) {
  return {
    id_concierto: fila.id_concierto,
    nombre: fila.nombre,
    artista: fila.artista?.nombre,
    categoria: nombresEstilo.get(String(fila.id_estiloMusical)) || "Sin categoría",
    fecha: fila.fecha,
    hora: fila.hora || "a confirmar",
    estadio: fila.estadio?.nombre,
    direccion: fila.estadio?.direccion,
    ciudad: fila.estadio?.ciudad,
    fans_unidos: fila.usuarios_conciertos?.[0]?.count ?? 0,
    cantidad_grupos: fila.grupo?.[0]?.count ?? 0,
  };
}

// Arma lo que la IA puede saber de este usuario. La privacidad se resuelve
// acá y no en el prompt: los grupos solo se cargan para los conciertos a
// los que el usuario está unido, así que la IA no puede contar lo que
// nunca recibió.
async function armarDatosParaUsuario(idUsuario) {
  const [conciertos, catalogo, relaciones, misGrupos] = await Promise.all([
    conciertoRepository.listarTodos(),
    estiloMusicalRepository.listarCatalogo(),
    usuariosConciertosRepository.listarConciertosPorUsuario(idUsuario),
    grupoUsuarioRepository.listarGruposPorUsuario(idUsuario),
  ]);

  const nombresEstilo = new Map(catalogo.map((e) => [String(idDeEstilo(e)), nombreDeEstilo(e)]));
  const idsUnidos = new Set(relaciones.map((r) => r.id_concierto));
  const idsMisGrupos = new Set(misGrupos.map((r) => r.id_grupo));
  const hoy = hoyISO();

  const proximos = conciertos
    .filter((c) => !c.fecha || String(c.fecha).slice(0, 10) >= hoy)
    .sort((a, b) => String(a.fecha || "9999").localeCompare(String(b.fecha || "9999")));

  const unidos = conciertos.filter((c) => idsUnidos.has(c.id_concierto));
  const gruposPorConcierto = await Promise.all(
    unidos.map((c) => grupoRepository.listarPorConcierto(c.id_concierto))
  );
  const todosLosGrupos = gruposPorConcierto.flat();
  const miembros = await grupoUsuarioRepository.listarUsuariosPorGrupos(
    todosLosGrupos.map((g) => g.id_grupo)
  );

  return {
    fecha_de_hoy: hoy,
    proximos_conciertos: proximos.map((c) => ({
      ...resumirConcierto(c, nombresEstilo),
      el_usuario_esta_unido: idsUnidos.has(c.id_concierto),
    })),
    conciertos_a_los_que_esta_unido: unidos.map((c, i) => ({
      ...resumirConcierto(c, nombresEstilo),
      grupos: gruposPorConcierto[i].map((g) => ({
        nombre: g.nombre,
        tipo: NOMBRES_CATEGORIA_GRUPO[g.categoria] || g.categoria,
        descripcion: g.descripcion || "",
        punto_de_encuentro: g.ubicacion,
        fecha: g.fecha,
        hora: g.hora,
        integrantes: miembros.filter((m) => m.id_grupo === g.id_grupo).length,
        el_usuario_es_miembro: idsMisGrupos.has(g.id_grupo),
      })),
    })),
  };
}

// El historial guardado pasa a formato de la API. La conversación tiene
// que arrancar con un mensaje del usuario.
function armarHistorial(filas) {
  const desdePrimeroDelUsuario = filas.slice(filas.findIndex((f) => f.rol === "user"));
  return desdePrimeroDelUsuario.map((f) => ({ role: f.rol, content: f.contenido }));
}

async function preguntarALaIA(idUsuario, historial) {
  const datos = await armarDatosParaUsuario(idUsuario);

  let respuesta;
  try {
    respuesta = await obtenerCliente().beta.messages.create({
      model: MODELO,
      max_tokens: 16000,
      output_config: { effort: "low" },
      // Si la IA principal rechaza una consulta por sus filtros de
      // seguridad, la API la reintenta sola con otro modelo.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: INSTRUCCIONES },
        { type: "text", text: `<datos_fanmeet>\n${JSON.stringify(datos)}\n</datos_fanmeet>` },
      ],
      messages: historial,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Anthropic.AuthenticationError) {
      throw new ApiError(503, "El chatbot no está bien configurado (revisá ANTHROPIC_API_KEY)");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new ApiError(429, "Fani está con muchas consultas, probá de nuevo en un ratito");
    }
    if (error instanceof Anthropic.APIError) {
      throw new ApiError(502, "Fani no pudo responder, probá de nuevo en un ratito");
    }
    throw error;
  }

  const texto = respuesta.content
    .filter((bloque) => bloque.type === "text")
    .map((bloque) => bloque.text)
    .join("")
    .trim();

  if (respuesta.stop_reason === "refusal" || !texto) {
    return `Perdón, con eso no te puedo ayudar 😕 Si necesitás algo más, escribinos a ${MAIL_QUEJAS}.`;
  }
  return texto;
}

export const chatbotService = {
  async listarMensajes(idUsuario, opciones) {
    const filas = await mensajeChatbotRepository.listarDeUsuario(idUsuario, opciones);
    return filas.map(toMensajeChatbot);
  },

  // Guarda lo que escribió el usuario, le pregunta a la IA con el
  // historial reciente y guarda la respuesta. Devuelve los dos mensajes.
  async enviar(idUsuario, contenido) {
    const texto = contenido.trim();
    if (!texto) throw ApiError.badRequest("El mensaje no puede estar vacío");

    const filaUsuario = await mensajeChatbotRepository.crear({
      idUsuario,
      rol: "user",
      contenido: texto,
    });

    const filas = await mensajeChatbotRepository.listarDeUsuario(idUsuario, {
      limite: MENSAJES_DE_HISTORIAL,
    });
    const textoRespuesta = await preguntarALaIA(idUsuario, armarHistorial(filas));

    const filaRespuesta = await mensajeChatbotRepository.crear({
      idUsuario,
      rol: "assistant",
      contenido: textoRespuesta,
    });

    return {
      mensajeUsuario: toMensajeChatbot(filaUsuario),
      respuesta: toMensajeChatbot(filaRespuesta),
    };
  },
};
