import { mensajeChatbotRepository } from "../repositories/mensajeChatbotRepository.js";
import {
  conciertoRepository,
  usuariosConciertosRepository,
} from "../repositories/conciertoRepository.js";
import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { artistaFavoritoRepository } from "../repositories/artistaFavoritoRepository.js";
import { amistadRepository } from "../repositories/amistadRepository.js";
import { calcularEdad } from "../entities/Usuario.js";
import { toMensajeChatbot } from "../entities/MensajeChatbot.js";
import { ApiError } from "../helpers/ApiError.js";

// Google Gemini, capa gratuita (key en https://aistudio.google.com/apikey).
const MODELO = process.env.GEMINI_MODEL || "gemini-3.8-flash";
// Si el modelo principal está saturado (o sin cuota), se prueban estos en
// orden. Los "lite" son los que menos se saturan. Se pueden cambiar con
// GEMINI_MODELOS_RESPALDO separados por coma.
const MODELOS_RESPALDO = (
  process.env.GEMINI_MODELOS_RESPALDO || "gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const URL_GEMINI = "https://generativelanguage.googleapis.com/v1beta/models";
// Cuántos mensajes anteriores del chat se le pasan a la IA como memoria.
const MENSAJES_DE_HISTORIAL = 30;
const MAIL_QUEJAS = "fanmeet100@gmail.com";

// Los mismos textos que muestra el perfil (src/componentes/perfil/perfil.jsx).
const NOMBRES_VIBRA = {
  pogo: "Pogos, campos: mucha energía, sudor y movimiento",
  tranquilo: "Platea: sentado y relajado con una bebida",
  campo: "Primera Fila: ojos en el escenario, cantando cada palabra",
};

const NOMBRES_CATEGORIA_GRUPO = {
  pre: "Previa (antes del concierto)",
  after: "After (después del concierto)",
  mismo_dia: "Mismo día",
};

const INSTRUCCIONES = `Sos Fani, la asistente virtual de la app FanMeet (tu logo es un robotito violeta que saluda). FanMeet conecta fans que van al mismo concierto: cada usuario se une a un concierto con un código de acceso y, una vez adentro, puede ver a los otros fans unidos, armar o sumarse a grupos (previa, after o mismo día), y chatear con sus amigos y con sus grupos.

Tu trabajo:
- Responder sobre el perfil del usuario con el que hablás (está en mi_perfil): su nombre, edad, su vibra en los conciertos, sus géneros y artistas favoritos y cuántos amigos tiene. Podés usarlo para personalizar: llamarlo por su nombre o recomendarle conciertos de la app que coincidan con sus gustos. Para cambiar algo del perfil, explicale que lo hace desde la sección Perfil de la app (vos no podés modificar nada).
- Contar cosas básicas sobre artistas y bandas (de dónde son, género, años de carrera, discos o canciones más conocidas), sobre todo de los que tocan en los conciertos de la app o están entre sus favoritos. Esto lo sabés por tu conocimiento general: quedate en lo conocido y, si no estás seguro de un dato o puede estar desactualizado (giras, lanzamientos recientes), decilo.
- Responder sobre los conciertos de la app de cada categoría (género musical): nombre del show, artista, fecha, hora, estadio, ciudad, cuántos fans y grupos tiene. Si un concierto tiene ya_paso en true, aclaralo ("fue el ...").
- Si el usuario está unido a un concierto, también podés contarle sobre los grupos de ese concierto.
- Ayudar con cómo usar la app: unirse a un concierto con el código, crear o sumarse a un grupo, agregar amigos, chatear, editar el perfil y los géneros favoritos.

Privacidad (muy importante):
- Solo tenés datos de grupos de los conciertos a los que el usuario está unido. Si pregunta por los grupos de un concierto al que no se unió, explicale que esa información es privada para quienes se unieron y que puede unirse desde el Inicio con el código de acceso del concierto. No inventes ni adivines grupos.
- Nunca reveles el código de acceso de un concierto (no lo tenés).
- No tenés datos de otros usuarios (ni de los amigos del usuario ni de otros fans) ni de sus chats.

Reglas:
- Todo lo que sea sobre FanMeet (conciertos, grupos, el perfil del usuario) sacalo solo de <datos_fanmeet>. Si algo no está ahí, decí que no lo sabés en vez de inventarlo. Tu conocimiento general usalo solo para hablar de los artistas y de música.
- Si el usuario tiene un problema que no podés resolver, quiere hacer un reclamo, reportar a alguien o un error de la app, ofrecele mandar un mail de queja a ${MAIL_QUEJAS} contando qué pasó.
- Hablá en español rioplatense, con voseo, en tono amigable y cercano. Respuestas cortas, como en un chat de WhatsApp: texto plano, sin títulos ni tablas ni markdown; podés usar algún emoji.
- Si te preguntan algo que no tiene nada que ver con FanMeet o la música en vivo, respondé brevemente y volvé a ofrecer ayuda con la app.`;

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
    // La hora viene dentro de fecha ("2026-08-28T21:00:00").
    fecha: fila.fecha ? String(fila.fecha).slice(0, 10) : "a confirmar",
    hora: fila.fecha && String(fila.fecha).length > 10 ? String(fila.fecha).slice(11, 16) : "a confirmar",
    ya_paso: Boolean(fila.fecha) && String(fila.fecha).slice(0, 10) < hoyISO(),
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
  const [conciertos, catalogo, relaciones, misGrupos, usuario, misEstilos, misArtistas, cantidadAmigos] =
    await Promise.all([
      conciertoRepository.listarTodos(),
      estiloMusicalRepository.listarCatalogo(),
      usuariosConciertosRepository.listarConciertosPorUsuario(idUsuario),
      grupoUsuarioRepository.listarGruposPorUsuario(idUsuario),
      usuarioRepository.obtenerPorId(idUsuario),
      estiloMusicalRepository.listarIdsPorUsuario(idUsuario),
      artistaFavoritoRepository.listarPorUsuario(idUsuario),
      amistadRepository.contarAceptadasDeUsuario(idUsuario),
    ]);

  const nombresEstilo = new Map(catalogo.map((e) => [String(idDeEstilo(e)), nombreDeEstilo(e)]));
  const idsUnidos = new Set(relaciones.map((r) => r.id_concierto));
  const idsMisGrupos = new Set(misGrupos.map((r) => r.id_grupo));
  const hoy = hoyISO();

  // Van todos los conciertos que muestra la app, también los que ya
  // pasaron (resumirConcierto los marca con ya_paso).
  const ordenados = [...conciertos].sort((a, b) => String(a.fecha || "9999").localeCompare(String(b.fecha || "9999")));

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
    // Solo datos del propio usuario. El mail y la fecha de nacimiento no
    // hacen falta para conversar, así que no se mandan a la IA.
    mi_perfil: {
      nombre: usuario?.nombre,
      edad: calcularEdad(usuario?.fechanac),
      vibra_en_conciertos: NOMBRES_VIBRA[usuario?.estilo_asistencia] || "sin elegir",
      generos_favoritos: misEstilos.map((e) => nombresEstilo.get(String(e.id_estilo))).filter(Boolean),
      artistas_favoritos: misArtistas.map((a) => a.nombre),
      cantidad_de_amigos: cantidadAmigos,
    },
    conciertos: ordenados.map((c) => ({
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

// El historial guardado pasa al formato de Gemini (el rol de la IA se
// llama "model"). La conversación tiene que arrancar con un mensaje del usuario.
function armarHistorial(filas) {
  const desdePrimeroDelUsuario = filas.slice(filas.findIndex((f) => f.rol === "user"));
  return desdePrimeroDelUsuario.map((f) => ({
    role: f.rol === "assistant" ? "model" : "user",
    parts: [{ text: f.contenido }],
  }));
}

async function preguntarALaIA(idUsuario, historial) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiError(503);
  }

  const datos = await armarDatosParaUsuario(idUsuario);
  const cuerpoPedido = JSON.stringify({
    systemInstruction: {
      parts: [
        { text: INSTRUCCIONES },
        { text: `<datos_fanmeet>\n${JSON.stringify(datos)}\n</datos_fanmeet>` },
      ],
    },
    contents: historial,
    generationConfig: {
      // El límite incluye lo que el modelo "piensa" antes de responder.
      maxOutputTokens: 2048,
      // Pensar poco: más rápido y gasta menos cuota gratis.
      thinkingConfig: { thinkingLevel: "low" },
    },
  });

  // 429: se acabó la cuota gratis de ese modelo. 503: Gemini está saturado.
  // En los dos casos se prueba con el modelo siguiente.
  const modelos = [...new Set([MODELO, ...MODELOS_RESPALDO])];
  let respuesta;
  for (const modelo of modelos) {
    try {
      respuesta = await fetch(`${URL_GEMINI}/${modelo}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: cuerpoPedido,
      });
    } catch {
      throw new ApiError(502, "Fani no pudo responder, probá de nuevo en un ratito");
    }
    if (respuesta.status !== 429 && respuesta.status !== 503) break;
    console.warn(`Gemini (${modelo}) respondió ${respuesta.status}: ${await respuesta.text().catch(() => "")}`);
  }

  if (!respuesta.ok) {
    if (respuesta.status === 429 || respuesta.status === 503) {
      throw new ApiError(429, "Fani está con muchas consultas, probá de nuevo en un ratito");
    }
    const detalle = await respuesta.text().catch(() => "");
    console.error(`Gemini respondió ${respuesta.status}: ${detalle}`);
    const keyInvalida = detalle.includes("API_KEY_INVALID");
    if (keyInvalida || respuesta.status === 401 || respuesta.status === 403) {
      throw new ApiError(503, "El chatbot no está bien configurado (revisá GEMINI_API_KEY)");
    }
    throw new ApiError(502, "Fani no pudo responder, probá de nuevo en un ratito");
  }

  const cuerpo = await respuesta.json();
  const candidato = cuerpo.candidates?.[0];
  const texto = (candidato?.content?.parts ?? [])
    .map((parte) => parte.text ?? "")
    .join("")
    .trim();

  // Bloqueado por los filtros de seguridad de Gemini, o respuesta vacía.
  const bloqueado = cuerpo.promptFeedback?.blockReason || candidato?.finishReason === "SAFETY";
  if (bloqueado || !texto) {
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
