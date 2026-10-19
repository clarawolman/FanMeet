// La app navega con el estado "pantalla" de App.jsx. Para que recargar la
// página (o compartir el link) deje a la persona donde estaba, cada
// pantalla tiene su URL y se puede reconstruir a partir de ella.

const SIMPLES = {
  "/": "home",
  "/login": "login",
  "/registro": "registro1",
  "/verificar-mail": "verificarMail",
  "/descubrir": "descubrir",
  "/chats": "chats",
  "/notificaciones": "notificaciones",
  "/mis-eventos": "misEventos",
  "/mis-grupos": "misGrupos",
  "/perfil": "perfil",
  "/perfil/generos": "editarGeneros",
};

const RUTA_SIMPLE = {
  home: "/",
  login: "/login",
  registro1: "/registro",
  registro2: "/registro",
  registro3: "/registro",
  verificarMail: "/verificar-mail",
  descubrir: "/descubrir",
  chats: "/chats",
  notificaciones: "/notificaciones",
  misEventos: "/mis-eventos",
  misGrupos: "/mis-grupos",
  perfil: "/perfil",
  editarGeneros: "/perfil/generos",
};

// Las que se pueden ver sin sesión
export const PANTALLAS_SIN_SESION = ["login", "registro1", "registro2", "registro3", "verificarMail"];

const NO_ENCONTRADA = { pantalla: "noEncontrada" };

// "/concierto/12/grupo/4" -> { pantalla: "infoGrupo", idConcierto: "12", idGrupo: "4" }
export function leerRuta(pathname) {
  const ruta = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (SIMPLES[ruta]) return { pantalla: SIMPLES[ruta] };

  const partes = ruta.split("/").filter(Boolean);
  const esId = (texto) => /^\d+$/.test(texto || "");

  if (partes[0] === "momento" && partes.length === 2) {
    return { pantalla: "momento", idMomento: partes[1] };
  }

  if (partes[0] === "usuario" && partes.length === 2) {
    return { pantalla: "perfilAjeno", idUsuario: partes[1] };
  }

  if (partes[0] !== "concierto" || !esId(partes[1])) return NO_ENCONTRADA;
  const idConcierto = partes[1];
  const resto = partes.slice(2).join("/");

  if (resto === "") return { pantalla: "concierto", idConcierto };
  if (resto === "fans") return { pantalla: "fansUnidos", idConcierto };
  if (resto === "crear-grupo") return { pantalla: "crearGrupo", idConcierto };

  if (partes[2] === "grupo" && esId(partes[3])) {
    const idGrupo = partes[3];
    if (partes.length === 4) return { pantalla: "infoGrupo", idConcierto, idGrupo };
    if (partes.length === 5 && partes[4] === "fans") {
      return { pantalla: "fansConfirmadosGrupo", idConcierto, idGrupo };
    }
  }

  return NO_ENCONTRADA;
}

// La URL de lo que se está viendo. null = no cambiar la URL (404).
export function rutaDePantalla(pantalla, { concierto, grupo, usuarioVisitado, idMomento } = {}) {
  if (RUTA_SIMPLE[pantalla]) return RUTA_SIMPLE[pantalla];

  const baseConcierto = concierto ? `/concierto/${concierto.id_concierto}` : null;
  const baseGrupo = baseConcierto && grupo ? `${baseConcierto}/grupo/${grupo.id_grupo}` : null;

  switch (pantalla) {
    case "momento":
      return idMomento ? `/momento/${idMomento}` : null;
    case "perfilAjeno":
      return usuarioVisitado ? `/usuario/${usuarioVisitado.id_usuario}` : null;
    case "concierto":
      return baseConcierto;
    case "fansUnidos":
      return baseConcierto && `${baseConcierto}/fans`;
    case "crearGrupo":
      return baseConcierto && `${baseConcierto}/crear-grupo`;
    case "infoGrupo":
      return baseGrupo;
    case "fansConfirmadosGrupo":
      return baseGrupo && `${baseGrupo}/fans`;
    default:
      return null;
  }
}

const TITULOS = {
  login: "Iniciar sesión",
  registro1: "Crear cuenta",
  registro2: "Crear cuenta",
  registro3: "Crear cuenta",
  verificarMail: "Verificar mail",
  home: "Inicio",
  descubrir: "Descubrir",
  chats: "Chats",
  notificaciones: "Notificaciones",
  misEventos: "Mis eventos",
  misGrupos: "Mis grupos",
  perfil: "Mi perfil",
  editarGeneros: "Editar géneros",
  crearGrupo: "Crear grupo",
  momento: "Momento",
  noEncontrada: "Página no encontrada",
  sinAcceso: "Acceso restringido",
};

// "FanMeet - Inicio", "FanMeet - Duki", "FanMeet - Fans unidos · Duki"...
export function tituloDePantalla(pantalla, { concierto, grupo, usuarioVisitado } = {}) {
  const nombreConcierto = concierto?.nombre || concierto?.artista?.nombre;
  let titulo = TITULOS[pantalla];

  if (pantalla === "concierto") titulo = nombreConcierto;
  if (pantalla === "fansUnidos") titulo = nombreConcierto && `Fans unidos · ${nombreConcierto}`;
  if (pantalla === "infoGrupo") titulo = grupo?.nombre;
  if (pantalla === "fansConfirmadosGrupo") titulo = grupo?.nombre && `Fans confirmados · ${grupo.nombre}`;
  if (pantalla === "perfilAjeno") titulo = usuarioVisitado?.apodo || usuarioVisitado?.nombre;

  return titulo ? `FanMeet - ${titulo}` : "FanMeet";
}
