import { mensajeChatbotRepository } from "../repositories/mensajeChatbotRepository.js";
import {
  conciertoRepository,
  usuariosConciertosRepository,
} from "../repositories/conciertoRepository.js";
import { grupoRepository, grupoUsuarioRepository } from "../repositories/grupoRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { artistaFavoritoRepository } from "../repositories/artistaFavoritoRepository.js";
import { usuarioService } from "./usuarioService.js";
import { grupoService } from "./grupoService.js";
import { sinBloqueados } from "./bloqueoService.js";
import {
  DECLARACIONES,
  NOMBRES_CATEGORIA_GRUPO,
  ejecutarHerramienta,
  validarUnionAGrupo,
} from "./faniHerramientas.js";
import { calcularEdad } from "../entities/Usuario.js";
import { toMensajeChatbot } from "../entities/MensajeChatbot.js";
import { ApiError } from "../helpers/ApiError.js";

// Groq (API compatible con OpenAI), capa gratuita: key en
// https://console.groq.com/keys. Groq corre los modelos en hardware propio
// (LPU) y responde mucho más rápido que Gemini.
const MODELO = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
// Si el modelo principal está saturado, sin cuota o falla con una
// herramienta, se prueban estos en orden. Cada modelo tiene su propia cuota
// gratis. Se pueden cambiar con GROQ_MODELOS_RESPALDO separados por coma.
const MODELOS_RESPALDO = (process.env.GROQ_MODELOS_RESPALDO || "llama-3.3-70b-versatile,openai/gpt-oss-20b")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const URL_GROQ = "https://api.groq.com/openai/v1/chat/completions";
// Si un modelo no contesta en este tiempo se prueba el siguiente.
const TIEMPO_MAXIMO_MS = 20_000;
// Cuántos mensajes anteriores del chat se le pasan a la IA como memoria.
// La capa gratis de Groq limita los tokens por minuto: con menos historial
// cada pedido es más chico (y más rápido).
const MENSAJES_DE_HISTORIAL = 16;
const MAIL_QUEJAS = "fanmeet100@gmail.com";

// Los mismos textos que muestra el perfil (src/componentes/perfil/perfil.jsx).
const NOMBRES_VIBRA = {
  pogo: "Pogos, campos: mucha energía, sudor y movimiento",
  tranquilo: "Platea: sentado y relajado con una bebida",
  campo: "Primera Fila: ojos en el escenario, cantando cada palabra",
};

// Cuántas veces seguidas puede la IA pedir herramientas antes de responder.
const MAXIMO_VUELTAS_HERRAMIENTAS = 4;

// Los mismos consejos que ModalConsejosSeguridad (src/componentes/infoGrupos).
const CONSEJOS_SEGURIDAD =
  "Antes de ir, acordate: avisale a alguien de confianza con quién vas, dónde y a qué hora; no compartas tu dirección, documentos ni datos bancarios; y si algo no está bien, reportá y bloqueá desde el perfil de la persona.";

const INSTRUCCIONES = `Sos Fani, la asistente virtual de la app FanMeet (tu logo es un robotito violeta que saluda). FanMeet conecta fans que van al mismo concierto: cada usuario se une a un concierto con un código de acceso y, una vez adentro, puede ver a los otros fans unidos, armar o sumarse a grupos (previa, after o mismo día), y chatear con sus amigos y con sus grupos.

Tu trabajo:
- Responder sobre el perfil del usuario con el que hablás (está en mi_perfil): su nombre, edad, su vibra en los conciertos, sus géneros y artistas favoritos y cuántos amigos tiene. Podés usarlo para personalizar: llamarlo por su nombre o recomendarle conciertos de la app que coincidan con sus gustos. Para cambiar algo del perfil, explicale que lo hace desde la sección Perfil de la app (vos no podés modificarlo).
- Contar cosas básicas sobre artistas y bandas (de dónde son, género, años de carrera, discos o canciones más conocidas), sobre todo de los que tocan en los conciertos de la app o están entre sus favoritos. Esto lo sabés por tu conocimiento general: quedate en lo conocido y, si no estás seguro de un dato o puede estar desactualizado (giras, lanzamientos recientes), decilo.
- Responder sobre los conciertos de la app de cada categoría (género musical): nombre del show, artista, fecha, hora, estadio, ciudad, cuántos fans y grupos tiene. Si un concierto tiene ya_paso en true, aclaralo ("fue el ...").
- Si el usuario está unido a un concierto, también podés contarle sobre los grupos de ese concierto.
- Ayudar con cómo usar la app: unirse a un concierto con el código, crear o sumarse a un grupo, agregar amigos, chatear, editar el perfil y los géneros favoritos.

Herramientas (usalas cuando hagan falta, sin nombrarlas ni mostrar ids):
- buscar_grupos_con_lugar: para recomendar grupos con lugar en sus conciertos.
- mis_grupos_y_proximos_eventos: para contarle sus grupos y sus próximos conciertos.
- proponer_unirse_a_grupo: solo cuando el usuario te pide sumarse a un grupo concreto. NUNCA lo suma: le aparecen los botones Confirmar y Cancelar debajo de tu mensaje, y se suma recién cuando toca Confirmar. Proponé un solo grupo por mensaje. Si el grupo no está claro, preguntale cuál antes de proponer. Si te contesta "sí" por escrito, recordale que toque Confirmar en tu mensaje anterior.
- En el historial, tus mensajes con una propuesta terminan con una nota entre corchetes que dice si el usuario la confirmó o la canceló. Esas notas son solo para vos: no las escribas en tus respuestas.
- Fuera de sumarse a un grupo con confirmación, no podés hacer nada por el usuario (crear grupos, salir, agregar amigos, cambiar el perfil): explicale cómo hacerlo desde la app.

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
  const [conciertos, catalogo, relaciones, misGrupos, usuario, misEstilos, misArtistas, estadisticas] =
    await Promise.all([
      conciertoRepository.listarTodos(),
      estiloMusicalRepository.listarCatalogo(),
      usuariosConciertosRepository.listarConciertosPorUsuario(idUsuario),
      grupoUsuarioRepository.listarGruposPorUsuario(idUsuario),
      usuarioRepository.obtenerPorId(idUsuario),
      estiloMusicalRepository.listarIdsPorUsuario(idUsuario),
      artistaFavoritoRepository.listarPorUsuario(idUsuario),
      // Mismo contador que el perfil (sin amigos suspendidos).
      usuarioService.obtenerEstadisticas(idUsuario),
    ]);

  const nombresEstilo = new Map(catalogo.map((e) => [String(idDeEstilo(e)), nombreDeEstilo(e)]));
  const idsUnidos = new Set(relaciones.map((r) => r.id_concierto));
  const idsMisGrupos = new Set(misGrupos.map((r) => r.id_grupo));
  const hoy = hoyISO();

  // Van todos los conciertos que muestra la app, también los que ya
  // pasaron (resumirConcierto los marca con ya_paso).
  const ordenados = [...conciertos].sort((a, b) => String(a.fecha || "9999").localeCompare(String(b.fecha || "9999")));

  const unidos = conciertos.filter((c) => idsUnidos.has(c.id_concierto));
  // Sin los grupos que creó alguien con quien hay un bloqueo.
  const gruposPorConcierto = await Promise.all(
    unidos.map(async (c) =>
      sinBloqueados(idUsuario, await grupoRepository.listarPorConcierto(c.id_concierto), "id_creador")
    )
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
      cantidad_de_amigos: estadisticas.amigos,
    },
    conciertos: ordenados.map((c) => ({
      ...resumirConcierto(c, nombresEstilo),
      el_usuario_esta_unido: idsUnidos.has(c.id_concierto),
    })),
    conciertos_a_los_que_esta_unido: unidos.map((c, i) => ({
      ...resumirConcierto(c, nombresEstilo),
      grupos: gruposPorConcierto[i].map((g) => ({
        id_grupo: g.id_grupo,
        nombre: g.nombre,
        tipo: NOMBRES_CATEGORIA_GRUPO[g.categoria] || g.categoria,
        descripcion: g.descripcion || "",
        punto_de_encuentro: g.ubicacion,
        fecha: g.fecha,
        hora: g.hora,
        integrantes: miembros.filter((m) => m.id_grupo === g.id_grupo).length,
        cupo: g.cupo ?? "sin límite",
        el_usuario_es_miembro: idsMisGrupos.has(g.id_grupo),
      })),
    })),
  };
}

// El historial guardado pasa al formato de chat de Groq/OpenAI. La
// conversación tiene que arrancar con un mensaje del usuario.
// A Fani le sirve saber qué pasó con sus propuestas anteriores.
const ESTADOS_ACCION = {
  pendiente: "el usuario todavía no la confirmó",
  hecha: "el usuario confirmó y ya está en el grupo",
  cancelada: "el usuario la canceló",
};

function notaDeAccion(accion) {
  if (accion?.tipo !== "unirse_grupo") return "";
  return `\n[propuesta: sumarse al grupo "${accion.grupo}" — ${ESTADOS_ACCION[accion.estado] || accion.estado}]`;
}

function armarHistorial(filas) {
  const desdePrimeroDelUsuario = filas.slice(filas.findIndex((f) => f.rol === "user"));
  return desdePrimeroDelUsuario.map((f) => ({
    role: f.rol === "assistant" ? "assistant" : "user",
    content: f.contenido + (f.rol === "assistant" ? notaDeAccion(f.accion) : ""),
  }));
}

// Las herramientas de Fani en el formato de Groq/OpenAI.
const HERRAMIENTAS = DECLARACIONES.map(({ name, description, parameters }) => ({
  type: "function",
  function: { name, description, parameters: parameters ?? { type: "object", properties: {} } },
}));

// Solo los gpt-oss "piensan": a los demás modelos no se les puede mandar
// reasoning_effort (Groq responde 400).
const esModeloQuePiensa = (modelo) => modelo.startsWith("openai/gpt-oss");

// Errores por los que vale la pena probar el modelo siguiente:
// 429 sin cuota, 413 pedido muy grande para la cuota de ese modelo,
// 5xx Groq caído o saturado, 400 "tool_use_failed" el modelo armó mal la
// llamada a una herramienta.
function convieneProbarOtro(status, detalle) {
  return status === 429 || status === 413 || status >= 500 || (status === 400 && detalle.includes("tool_use_failed"));
}

// Un pedido a Groq, probando los modelos de respaldo si hace falta.
// Devuelve el mensaje de la IA ({ content, tool_calls }).
async function llamarAGroq(apiKey, messages) {
  const modelos = [...new Set([MODELO, ...MODELOS_RESPALDO])];
  let ultimoStatus = 0;

  for (const modelo of modelos) {
    let respuesta;
    try {
      respuesta = await fetch(URL_GROQ, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: modelo,
          messages,
          tools: HERRAMIENTAS,
          tool_choice: "auto",
          temperature: 0.6,
          // El límite incluye lo que el modelo "piensa" antes de responder.
          max_completion_tokens: 1024,
          // Pensar poco y no devolver el razonamiento: más rápido.
          ...(esModeloQuePiensa(modelo) ? { reasoning_effort: "low", include_reasoning: false } : {}),
        }),
        signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
      });
    } catch (error) {
      // Se colgó: se prueba el siguiente. Sin red: no tiene sentido seguir.
      if (error?.name === "TimeoutError") {
        console.warn(`Groq (${modelo}) no respondió en ${TIEMPO_MAXIMO_MS} ms`);
        ultimoStatus = 504;
        continue;
      }
      throw new ApiError(502, "Fani no pudo responder, probá de nuevo en un ratito");
    }

    if (respuesta.ok) {
      const cuerpo = await respuesta.json();
      return cuerpo.choices?.[0] ?? null;
    }

    const detalle = await respuesta.text().catch(() => "");
    ultimoStatus = respuesta.status;
    if (respuesta.status === 401 || respuesta.status === 403 || detalle.includes("invalid_api_key")) {
      console.error(`Groq respondió ${respuesta.status}: ${detalle}`);
      throw new ApiError(503, "El chatbot no está bien configurado (revisá GROQ_API_KEY)");
    }
    if (!convieneProbarOtro(respuesta.status, detalle)) {
      console.error(`Groq (${modelo}) respondió ${respuesta.status}: ${detalle}`);
      throw new ApiError(502, "Fani no pudo responder, probá de nuevo en un ratito");
    }
    console.warn(`Groq (${modelo}) respondió ${respuesta.status}: ${detalle}`);
  }

  if (ultimoStatus === 429 || ultimoStatus === 413) {
    throw new ApiError(429, "Fani está con muchas consultas, probá de nuevo en un ratito");
  }
  throw new ApiError(502, "Fani no pudo responder, probá de nuevo en un ratito");
}

function leerArgumentos(texto) {
  try {
    return texto ? JSON.parse(texto) : {};
  } catch {
    return {};
  }
}

// Le pregunta a la IA y ejecuta las herramientas que pida, hasta que
// responde con texto. Devuelve { texto, accion }: la acción (si propuso
// una) queda pendiente hasta que el usuario la confirma.
async function preguntarALaIA(idUsuario, historial) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ApiError(503);
  }

  const datos = await armarDatosParaUsuario(idUsuario);
  const messages = [
    {
      role: "system",
      content: `${INSTRUCCIONES}\n\n<datos_fanmeet>\n${JSON.stringify(datos)}\n</datos_fanmeet>`,
    },
    ...historial,
  ];
  let accion = null;
  const sinRespuesta = `Perdón, con eso no te puedo ayudar 😕 Si necesitás algo más, escribinos a ${MAIL_QUEJAS}.`;

  for (let vuelta = 0; vuelta < MAXIMO_VUELTAS_HERRAMIENTAS; vuelta++) {
    const eleccion = await llamarAGroq(apiKey, messages);
    const mensaje = eleccion?.message;

    // Cortado por el filtro de contenido del modelo.
    if (eleccion?.finish_reason === "content_filter") {
      return { texto: sinRespuesta, accion: null };
    }

    const llamadas = mensaje?.tool_calls ?? [];
    if (llamadas.length === 0) {
      const texto = (mensaje?.content ?? "").trim();
      if (texto) return { texto, accion };
      break;
    }

    // Se devuelve el turno de la IA con sus pedidos y después una respuesta
    // por cada herramienta, con el mismo tool_call_id.
    messages.push({ role: "assistant", content: mensaje.content ?? "", tool_calls: llamadas });
    for (const llamada of llamadas) {
      const { name, arguments: args } = llamada.function ?? {};
      const resultado = await ejecutarHerramienta(idUsuario, name, leerArgumentos(args));
      if (resultado.accion) accion = resultado.accion;
      messages.push({ role: "tool", tool_call_id: llamada.id, content: JSON.stringify(resultado.respuesta) });
    }
  }

  // Propuso sumarse pero no escribió nada: igual se muestran los botones.
  if (accion) return { texto: `¿Te sumo a "${accion.grupo}"? Tocá Confirmar y listo 🙌`, accion };
  return { texto: sinRespuesta, accion: null };
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
    const { texto: textoRespuesta, accion } = await preguntarALaIA(idUsuario, armarHistorial(filas));

    const filaRespuesta = await mensajeChatbotRepository.crear({
      idUsuario,
      rol: "assistant",
      contenido: textoRespuesta,
      accion,
    });

    return {
      mensajeUsuario: toMensajeChatbot(filaUsuario),
      respuesta: toMensajeChatbot(filaRespuesta),
    };
  },

  // El usuario tocó Confirmar o Cancelar en una propuesta de Fani. Acá se
  // hace la acción de verdad, con las mismas validaciones que la app.
  // Devuelve el mensaje actualizado y, si se sumó, la respuesta de Fani.
  async resolverAccion(idUsuario, idMensaje, decision) {
    const fila = await mensajeChatbotRepository.obtenerDeUsuario(idUsuario, idMensaje);
    if (!fila?.accion) throw ApiError.notFound("Ese mensaje no tiene nada para confirmar");
    const yaResuelta = () => new ApiError(409, "Eso ya lo resolviste");
    if (fila.accion.estado !== "pendiente") throw yaResuelta();

    if (decision === "cancelar") {
      const actualizada = await mensajeChatbotRepository.cambiarAccion(idMensaje, "pendiente", {
        ...fila.accion,
        estado: "cancelada",
      });
      if (!actualizada) throw yaResuelta();
      return { mensaje: toMensajeChatbot(actualizada), respuesta: null };
    }

    // Primero se marca como hecha: si llegan dos "Confirmar" a la vez, solo
    // uno pasa. Si unirse falla, vuelve a quedar pendiente.
    const reservada = await mensajeChatbotRepository.cambiarAccion(idMensaje, "pendiente", {
      ...fila.accion,
      estado: "hecha",
    });
    if (!reservada) throw yaResuelta();

    let grupo;
    try {
      ({ grupo } = await validarUnionAGrupo(idUsuario, fila.accion.id_grupo));
      await grupoService.unirse(idUsuario, fila.accion.id_grupo);
    } catch (error) {
      await mensajeChatbotRepository.cambiarAccion(idMensaje, "hecha", fila.accion);
      throw error;
    }

    const filaRespuesta = await mensajeChatbotRepository.crear({
      idUsuario,
      rol: "assistant",
      contenido: `¡Listo, ya estás en "${grupo.nombre}"! 🙌 Lo tenés en Mis grupos y ya podés escribir en el chat del grupo. ${CONSEJOS_SEGURIDAD}`,
    });
    return { mensaje: toMensajeChatbot(reservada), respuesta: toMensajeChatbot(filaRespuesta) };
  },
};
