import { useContext, useEffect, useRef, useState } from "react";

import CargandoPantalla from "./componentes/generales/CargandoPantalla";
import PaginaNoEncontrada from "./componentes/generales/PaginaNoEncontrada";
import Concierto from "./componentes/concierto/Concierto";
import InfoGrupo from "./componentes/infoGrupos/infoGrupo";
import CrearGrupo from "./componentes/crearGrupo/CrearGrupo";
import Home from "./componentes/home/Home";
import IniciarSesionRegistrarse from "./componentes/Login/IniciarSesion-Registrarse/IniciarSesionRegistrarse";
import Registro1 from "./componentes/Login/Registro1/Registro1";
import Registro2 from "./componentes/Login/Registro2/Registro2";
import Registro3 from "./componentes/Login/Registro3/Registro3";
import VerificarMail from "./componentes/Login/VerificarMail/VerificarMail";
import MisEventos from "./componentes/misEventos/MisEventos";
import MisGrupos from "./componentes/misGrupos/MisGrupos";
import Perfil from "./componentes/perfil/perfil";
import EditarGeneros from "./componentes/editarGeneros/EditarGeneros";
import FansUnidosLista from "./componentes/concierto/FansUnidosLista";
import Notificaciones from "./componentes/notificaciones/Notificaciones";
import Chats from "./componentes/chats/Chats";
import Descubrir from "./componentes/descubrir/Descubrir";
import MomentoDetalle from "./componentes/momento/MomentoDetalle";
import MenuLateral from "./componentes/generales/MenuLateral";
import Avisos from "./componentes/generales/Avisos";
import { ID_CHATBOT } from "./services/chatbotService";
import { mostrarAviso } from "./utils/avisos";

import { authService } from "./services/authService";
import { usuariosService } from "./services/usuariosService";
import { conciertosService } from "./services/conciertosService";
import { gruposService } from "./services/gruposService";
import { spotifyService } from "./services/spotifyService";
import { UsuarioContext } from "./context/UsuarioContext";
import { supabase } from "./supabase";
import { leerRuta, rutaDePantalla, tituloDePantalla, PANTALLAS_SIN_SESION } from "./utils/rutas";

// Si api.js cerró la sesión porque la cuenta fue suspendida, deja el
// motivo acá para mostrarlo en el login después de recargar.
function leerAvisoLogin() {
  try {
    const aviso = sessionStorage.getItem("fanmeet-aviso-login") || "";
    sessionStorage.removeItem("fanmeet-aviso-login");
    return aviso;
  } catch {
    return "";
  }
}

function App() {
  const [pantalla, setPantalla] = useState("login");

  // Cada pantalla nueva arranca desde arriba (si no, hereda el scroll de
  // la anterior y se abre "a la mitad").
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pantalla]);

  // El usuario logueado vive en UsuarioContext (src/context/UsuarioContext.jsx).
  const { usuarioActual, setUsuarioActual } = useContext(UsuarioContext);
  const [datosRegistro, setDatosRegistro] = useState({});
  // Pantalla "verificarMail": a qué mail se mandó el código, si hay que
  // mandar uno nuevo al entrar (viene del login) y lo que quedó pendiente
  // del registro (foto y artistas necesitan sesión).
  const [verificacion, setVerificacion] = useState(null);
  const [concierto, setConcierto] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [usuarioVisitado, setUsuarioVisitado] = useState(null);
  // Chat a abrir al entrar a "chats": { tipo: "privado" | "grupo", id }
  // (desde el perfil de un amigo, fans unidos, un grupo o una notificación)
  const [chatInicial, setChatInicial] = useState(null);
  // Pantalla a la que vuelve la info del grupo (concierto, mis grupos, chats)
  const [pantallaAntesDeGrupo, setPantallaAntesDeGrupo] = useState("concierto");
  // Pantalla a la que vuelve el perfil ajeno (fans unidos, chats, ...)
  const [pantallaAntesDePerfil, setPantallaAntesDePerfil] = useState("fansUnidos");
  // Momento abierto (pantalla "momento") y a dónde vuelve
  const [idMomento, setIdMomento] = useState(null);
  const [pantallaAntesDeMomento, setPantallaAntesDeMomento] = useState("home");

  const [cargando, setCargando] = useState(false);
  const [errorTexto, setErrorTexto] = useState(leerAvisoLogin);
  // Al recargar la página, supabase-js todavía tiene la sesión guardada en
  // localStorage: mientras se recupera el usuario no se muestra el login.
  const [restaurandoSesion, setRestaurandoSesion] = useState(true);
  // URL protegida que se abrió sin sesión: se va ahí después del login.
  const rutaPendiente = useRef(null);
  // Página 403: si lo que no se puede ver es un concierto o un grupo
  const [recursoSinAcceso, setRecursoSinAcceso] = useState("concierto");
  const primeraSincronizacion = useRef(true);
  const irARutaRef = useRef(null);

  // Al recargar se vuelve a la pantalla de la URL (ver utils/rutas.js).
  useEffect(() => {
    let activo = true;
    const ruta = leerRuta(window.location.pathname);

    async function restaurarSesion() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (activo) await irARuta(ruta, null);
          return;
        }
        const usuario = await usuariosService.obtenerMiPerfil();
        if (!activo) return;
        setUsuarioActual(usuario);
        await irARuta(ruta, usuario);
      } catch (error) {
        // Sesión vencida o usuario borrado: se limpia y queda el login.
        console.error("No se pudo restaurar la sesión:", error);
        if (error.status === 401 || error.status === 404) await supabase.auth.signOut();
        if (activo) await irARuta(ruta, null);
      } finally {
        if (activo) setRestaurandoSesion(false);
      }
    }

    restaurarSesion();
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La URL y el título de la pestaña siguen a la pantalla. La primera vez
  // se reemplaza la entrada del historial (ej. /mis-eventos sin sesión ->
  // /login), después cada pantalla nueva suma una para que ande "atrás".
  useEffect(() => {
    if (restaurandoSesion) return;
    const datos = { concierto, grupo: grupoSeleccionado, usuarioVisitado, idMomento };
    document.title = tituloDePantalla(pantalla, datos);

    const ruta = rutaDePantalla(pantalla, datos);
    if (ruta && ruta !== window.location.pathname) {
      if (primeraSincronizacion.current) window.history.replaceState(null, "", ruta);
      else window.history.pushState(null, "", ruta);
    }
    primeraSincronizacion.current = false;
  }, [restaurandoSesion, pantalla, concierto, grupoSeleccionado, usuarioVisitado, idMomento]);

  // Atrás / adelante del navegador
  useEffect(() => {
    irARutaRef.current = irARuta;
  });

  useEffect(() => {
    function alCambiarHistorial() {
      irARutaRef.current?.(leerRuta(window.location.pathname));
    }
    window.addEventListener("popstate", alCambiarHistorial);
    return () => window.removeEventListener("popstate", alCambiarHistorial);
  }, []);

  // Abre la pantalla de una URL, cargando lo que necesite (concierto,
  // grupo, perfil). Si no existe o no hay acceso, 404.
  async function irARuta(ruta, usuario = usuarioActual) {
    const { pantalla: destino, idConcierto, idGrupo, idUsuario } = ruta;

    if (destino === "noEncontrada") {
      setPantalla("noEncontrada");
      return;
    }

    if (!usuario) {
      // verificarMail necesita datos que se pierden al recargar
      if (PANTALLAS_SIN_SESION.includes(destino) && destino !== "verificarMail") {
        setPantalla(destino);
      } else {
        if (!PANTALLAS_SIN_SESION.includes(destino)) rutaPendiente.current = ruta;
        setPantalla("login");
      }
      return;
    }

    if (PANTALLAS_SIN_SESION.includes(destino)) {
      manejarNavegacion("home");
      return;
    }

    // Si no existe, la pantalla del momento muestra el 404
    if (destino === "momento") {
      setIdMomento(ruta.idMomento);
      setPantallaAntesDeMomento("home");
      setPantalla("momento");
      return;
    }

    if (destino === "perfilAjeno") {
      if (idUsuario === usuario.id_usuario) {
        setPantalla("perfil");
        return;
      }
      try {
        setUsuarioVisitado(await usuariosService.obtenerPerfil(idUsuario));
        setPantallaAntesDePerfil("home");
        setPantalla("perfilAjeno");
      } catch {
        setPantalla("noEncontrada");
      }
      return;
    }

    if (idConcierto) {
      let detalle = concierto;
      if (String(concierto?.id_concierto) !== idConcierto) {
        setCargando(true);
        try {
          detalle = await conciertosService.obtenerDetalle(idConcierto);
        } catch (error) {
          // 403: existe pero no se unió al concierto. En la URL de un grupo
          // se pregunta por el grupo, para no decir que existe si no.
          let estado = error.status;
          if (estado === 403 && idGrupo) {
            estado = await gruposService.obtenerDetalle(idGrupo).then(
              () => 403,
              (errorGrupo) => errorGrupo.status
            );
          }
          setCargando(false);
          if (estado === 403) {
            setRecursoSinAcceso(idGrupo ? "grupo" : "concierto");
            setPantalla("sinAcceso");
          } else {
            setPantalla("noEncontrada");
          }
          return;
        }
        setCargando(false);
        setConcierto(detalle);
      }

      if (idGrupo) {
        const grupo = (detalle.grupos || []).find((g) => String(g.id_grupo) === idGrupo);
        if (!grupo) {
          setPantalla("noEncontrada");
          return;
        }
        setGrupoSeleccionado(grupo);
        setPantallaAntesDeGrupo("concierto");
      }

      setPantalla(destino);
      return;
    }

    if (destino === "chats") setChatInicial(null);
    setPantalla(destino);
  }

  async function cargarConciertoPorId(idConcierto) {
    setCargando(true);
    setErrorTexto("");

    try {
      const conciertoFinal = await conciertosService.obtenerDetalle(idConcierto);
      setConcierto(conciertoFinal);
      setCargando(false);
      return true;
    } catch (error) {
      setErrorTexto(error.message || "No se pudo cargar el concierto");
      setCargando(false);
      // errorTexto solo se ve en el login: dentro de la app va como aviso
      mostrarAviso(
        error.status === 403
          ? "Para entrar a ese concierto tenés que unirte con el código desde el inicio."
          : error.message || "No se pudo cargar el concierto"
      );
      return false;
    }
  }

  // Cuando se conecta/acepta desde "Fans unidos", se actualiza el concierto
  // en memoria para que el estado se mantenga al volver a la lista.
  function actualizarAmistadFan(idUsuario, cambios) {
    setConcierto((anterior) =>
      anterior
        ? {
            ...anterior,
            usuarios: (anterior.usuarios || []).map((u) =>
              u.id_usuario === idUsuario ? { ...u, ...cambios } : u
            ),
          }
        : anterior
    );
  }

  async function manejarIngreso(usuario) {
    setUsuarioActual(usuario);
    setConcierto(null);
    setGrupoSeleccionado(null);
    setErrorTexto("");

    const pendiente = rutaPendiente.current;
    rutaPendiente.current = null;
    if (pendiente) {
      await irARuta(pendiente, usuario);
      return;
    }
    setPantalla("home");
  }

  async function manejarCerrarSesion() {
    rutaPendiente.current = null;
    await authService.logout();
    setUsuarioActual(null);
    setUsuarioVisitado(null);
    setConcierto(null);
    setGrupoSeleccionado(null);
    setErrorTexto("");
    setPantalla("login");
  }

  function manejarNavegacion(destino) {
    if (destino === "home") {
      setConcierto(null);
      setGrupoSeleccionado(null);
      setErrorTexto("");
      setPantalla("home");
      return;
    }

    if (destino === "chats") setChatInicial(null);
    setPantalla(destino);
  }

  function manejarEnviarMensaje(idUsuario) {
    setChatInicial({ tipo: "privado", id: idUsuario });
    setPantalla("chats");
  }

  function manejarAbrirChatbot() {
    setChatInicial({ tipo: "bot", id: ID_CHATBOT });
    setPantalla("chats");
  }

  function manejarAbrirChatGrupo(idGrupo) {
    setChatInicial({ tipo: "grupo", id: idGrupo });
    setPantalla("chats");
  }

  // Abre la info de un grupo desde fuera del concierto (Mis grupos, Chats):
  // InfoGrupo necesita el concierto del grupo (fans, etc.), así que se
  // carga antes.
  async function abrirGrupoConConcierto(grupo, origen) {
    const pudoCargar = await cargarConciertoPorId(grupo.id_concierto);
    if (!pudoCargar) {
      setPantalla(origen);
      return;
    }
    setGrupoSeleccionado(grupo);
    setPantallaAntesDeGrupo(origen);
    setPantalla("infoGrupo");
  }

  async function manejarVerUsuario(idUsuario) {
    // Tocar tu propia foto (en amigos de otro, fans, chats...) abre tu
    // perfil, nunca la vista "ajena" con el botón de conectar.
    if (idUsuario === usuarioActual?.id_usuario) {
      manejarNavegacion("perfil");
      return;
    }

    try {
      const usuario = await usuariosService.obtenerPerfil(idUsuario);
      setUsuarioVisitado(usuario);
      if (pantalla !== "perfilAjeno") setPantallaAntesDePerfil(pantalla);
      setPantalla("perfilAjeno");
    } catch (error) {
      console.error("Error cargando usuario:", error);
    }
  }

  // Abre un momento (publicación) desde un perfil, una notificación o un chat
  function abrirMomento(id) {
    setIdMomento(id);
    if (pantalla !== "momento") setPantallaAntesDeMomento(pantalla);
    setPantalla("momento");
  }

  async function manejarEntrarConcierto(idConcierto) {
    const pudoCargar = await cargarConciertoPorId(idConcierto);

    if (pudoCargar) {
      setPantalla("concierto");
    }
  }

  async function recargarDatos() {
    if (!concierto) return;
    await cargarConciertoPorId(concierto.id_concierto);
  }

  function guardarDatosRegistro(datos) {
    setDatosRegistro((anteriores) => ({ ...anteriores, ...datos }));
  }
  async function manejarVerMasNotificacion(notificacion) {
    if (
      (notificacion.tipo === "concierto_unido" || notificacion.tipo === "novedad_concierto") &&
      notificacion.id_concierto
    ) {
      await manejarEntrarConcierto(notificacion.id_concierto);
      return;
    }

    if (
      (notificacion.tipo === "momento_like" || notificacion.tipo === "momento_comentario") &&
      notificacion.id_highlight
    ) {
      abrirMomento(notificacion.id_highlight);
      return;
    }

    if (notificacion.tipo === "grupo_unido") {
      setPantalla("misGrupos");
    }

    if (notificacion.tipo === "mensaje_grupo" && notificacion.id_grupo) {
      manejarAbrirChatGrupo(notificacion.id_grupo);
      return;
    }

    if (notificacion.tipo === "mensaje_privado" && notificacion.id_usuario_relacionado) {
      manejarEnviarMensaje(notificacion.id_usuario_relacionado);
      return;
    }

    if (
      notificacion.tipo === "amistad_aceptada" &&
      notificacion.id_usuario_relacionado
    ) {
      await manejarVerUsuario(notificacion.id_usuario_relacionado);
    }
  }


  function salirDelRegistro() {
    setDatosRegistro({});
    setErrorTexto("");
    setPantalla("login");
  }

  function volverDeRegistro2ARegistro1() {
    setPantalla("registro1");
  }

  function volverDeRegistro3ARegistro2() {
    setPantalla("registro2");
  }

  function volverPantallaAnterior() {
    if (pantallaAntesDeGrupo === "concierto" && !concierto) {
      setPantalla("misGrupos");
      return;
    }
    setPantalla(pantallaAntesDeGrupo);
  }

  function manejarRegistro1(datosPaso1) {
    guardarDatosRegistro(datosPaso1);
    setPantalla("registro2");
  }

  function manejarRegistro2(datosPaso2) {
    guardarDatosRegistro(datosPaso2);
    setPantalla("registro3");
  }

async function manejarFinalizarRegistro(datosPaso3) {
  setCargando(true);
  setErrorTexto("");

  const datosFinales = {
    ...datosRegistro,
    ...datosPaso3,
  };

  // Reemplaza signUp + insert en "usuario" + insert en
  // "estilo_musical_usuario" por una sola llamada al backend, que hace las
  // 3 cosas en ese mismo orden (backend/src/services/authService.js) y
  // devuelve exactamente los mismos mensajes de error.
  // La foto elegida en Registro2 es un File con una URL blob: de preview,
  // que solo existe en esta pestaña: no se manda al backend. El archivo se
  // sube a Storage recién cuando la cuenta ya existe (necesita sesión).
  const archivoFoto = datosFinales.foto_perfil;
  // Los artistas favoritos (Registro3) también necesitan sesión: se suman
  // después de crear la cuenta, como la foto.
  const artistasFavoritos = datosFinales.artistas_favoritos || [];
  const datosSinFoto = { ...datosFinales };
  delete datosSinFoto.foto_perfil;
  delete datosSinFoto.previewFoto;
  delete datosSinFoto.artistas_favoritos;

  try {
    const { usuario, requiereConfirmacion } = await authService.registro(datosSinFoto);

    if (requiereConfirmacion) {
      // Sin sesión hasta confirmar el mail: la foto y los artistas se
      // guardan cuando se verifica el código.
      setVerificacion({ mail: usuario.mail, enviarAlEntrar: false, archivoFoto, artistasFavoritos });
      setDatosRegistro({});
      setCargando(false);
      setPantalla("verificarMail");
      return;
    }

    await completarRegistro(usuario, archivoFoto, artistasFavoritos);
  } catch (error) {
    setErrorTexto(error.message || "Error al registrar usuario");
    setCargando(false);
  }
}

// Lo que necesita sesión: se corre apenas se crea la cuenta o, si hubo que
// confirmar el mail, después de verificar el código.
async function completarRegistro(usuario, archivoFoto, artistasFavoritos = []) {
    let usuarioCreado = usuario;

    if (archivoFoto instanceof File) {
      try {
        usuarioCreado = await usuariosService.subirFoto(archivoFoto);
      } catch (errorFoto) {
        // La cuenta ya está creada: si falla la foto queda la de por
        // defecto y se puede cambiar después desde el perfil.
        console.error("No se pudo subir la foto de perfil:", errorFoto);
      }
    }

    // En orden, para que el carrusel del perfil quede como los eligió.
    // Si alguno falla se puede volver a agregar desde el perfil.
    for (const spotifyId of artistasFavoritos) {
      try {
        await spotifyService.agregarFavorito(spotifyId);
      } catch (errorArtista) {
        console.error("No se pudo guardar el artista favorito:", errorArtista);
      }
    }

    setUsuarioActual(usuarioCreado);
    setDatosRegistro({});
    setVerificacion(null);
    setCargando(false);
    setPantalla("home");
}

  async function manejarMailVerificado(usuario) {
    await completarRegistro(usuario, verificacion?.archivoFoto, verificacion?.artistasFavoritos);
  }

  function manejarMailSinConfirmar(mail) {
    setVerificacion({ mail, enviarAlEntrar: true });
    setPantalla("verificarMail");
  }

  function salirDeVerificacion() {
    setVerificacion(null);
    setPantalla("login");
  }

  const esPantallaLogin =
    pantalla === "login" ||
    pantalla === "registro1" ||
    pantalla === "registro2" ||
    pantalla === "registro3" ||
    pantalla === "verificarMail";

  if (restaurandoSesion) {
    return <CargandoPantalla texto="Cargando..." />;
  }

  if (!esPantallaLogin && pantalla !== "home" && cargando) {
    return <CargandoPantalla texto="Cargando concierto..." />;
  }

  if (
    !esPantallaLogin &&
    pantalla !== "home" &&
    pantalla !== "misEventos" &&
    pantalla !== "misGrupos" &&
    pantalla !== "crearGrupo" &&
    pantalla !== "infoGrupo" &&
    pantalla !== "concierto" &&
    pantalla !== "perfil" &&
    pantalla !== "editarGeneros" &&
    pantalla !== "fansUnidos" &&
    pantalla !== "fansConfirmadosGrupo" &&
    pantalla !== "perfilAjeno" &&
    pantalla !== "notificaciones" &&
    pantalla !== "chats" &&
    pantalla !== "descubrir" &&
    pantalla !== "momento"
  ) {
    return (
      <PaginaNoEncontrada
        tipo={pantalla === "sinAcceso" ? "sinAcceso" : "noEncontrada"}
        recurso={recursoSinAcceso}
        conSesion={Boolean(usuarioActual)}
        onIrAlInicio={() => (usuarioActual ? manejarNavegacion("home") : setPantalla("login"))}
      />
    );
  }

  return (
    <>
      <Avisos />
      {!esPantallaLogin && usuarioActual && (
        <MenuLateral
          pantallaActiva={pantalla}
          onNavegar={manejarNavegacion}
          onCerrarSesion={manejarCerrarSesion}
        />
      )}

      {errorTexto && esPantallaLogin && (
        <p className="fmAvisoError fmAvisoErrorLogin" role="alert">{errorTexto}</p>
      )}

      {pantalla === "login" && (
        <IniciarSesionRegistrarse
          onIngresar={manejarIngreso}
          onRegistrarse={() => setPantalla("registro1")}
          onMailSinConfirmar={manejarMailSinConfirmar}
        />
      )}

      {pantalla === "verificarMail" && verificacion && (
        <VerificarMail
          mail={verificacion.mail}
          enviarAlEntrar={verificacion.enviarAlEntrar}
          onVerificado={manejarMailVerificado}
          onVolver={salirDeVerificacion}
        />
      )}

      {pantalla === "registro1" && (
        <Registro1
          datosIniciales={datosRegistro}
          onVolver={salirDelRegistro}
          onSiguiente={manejarRegistro1}
        />
      )}

      {pantalla === "registro2" && (
        <Registro2
          datosIniciales={datosRegistro}
          onVolver={volverDeRegistro2ARegistro1}
          onSiguiente={manejarRegistro2}
        />
      )}

      {pantalla === "registro3" && (
        <Registro3
          datosIniciales={datosRegistro}
          onVolver={volverDeRegistro3ARegistro2}
          onFinalizar={manejarFinalizarRegistro}
        />
      )}
     {pantalla === "misEventos" && usuarioActual && (
  <MisEventos
    onIngresar={async (evento) => {
      const pudoCargar = await cargarConciertoPorId(evento.id_concierto);

      if (pudoCargar) {
        setPantalla("concierto");
      }
    }}
    onIrMisGrupos={() => setPantalla("misGrupos")}
    onNavegar={manejarNavegacion}
  />
)}
       {pantalla === "misGrupos" && usuarioActual && (
  <MisGrupos
    onVolver={() => setPantalla("misEventos")}
    onNavegar={setPantalla}
    onAbrirGrupo={(grupo) => abrirGrupoConConcierto(grupo, "misGrupos")}
  />
)}

      {pantalla === "perfil" && usuarioActual && (
        <Perfil
          isOwnProfile={true}
          onEditarGeneros={() => setPantalla("editarGeneros")}
          onNavegar={manejarNavegacion}
          onCerrarSesion={manejarCerrarSesion}
          onVerUsuario={manejarVerUsuario}
          onIngresarConcierto={manejarEntrarConcierto}
          onAbrirMomento={abrirMomento}
        />
      )}

      {pantalla === "editarGeneros" && usuarioActual && (
        <EditarGeneros
          onVolver={() => setPantalla("perfil")}
        />
      )}

      {pantalla === "perfilAjeno" && usuarioVisitado && usuarioActual && (
        <Perfil
          usuarioPerfil={usuarioVisitado}
          isOwnProfile={false}
          onNavegar={manejarNavegacion}
          onVolver={() => setPantalla(pantallaAntesDePerfil)}
          onVerUsuario={manejarVerUsuario}
          onEnviarMensaje={manejarEnviarMensaje}
          onAbrirMomento={abrirMomento}
          onIngresarConcierto={manejarEntrarConcierto}
        />
      )}

      {pantalla === "fansUnidos" && concierto && (
        <FansUnidosLista
          fans={concierto.usuarios}
          cantidadFans={concierto.cantidadFans || concierto.asistentes || 0}
          onVolver={() => setPantalla("concierto")}
          onVerUsuario={manejarVerUsuario}
          onCambioAmistad={actualizarAmistadFan}
          onEnviarMensaje={manejarEnviarMensaje}
        />
      )}

      {pantalla === "home" && usuarioActual && (
        <Home
          onEntrarConcierto={manejarEntrarConcierto}
          onNavegar={manejarNavegacion}
          onVerUsuario={manejarVerUsuario}
          onAbrirChatbot={manejarAbrirChatbot}
        />
      )}

      {pantalla === "descubrir" && usuarioActual && (
        <Descubrir onNavegar={manejarNavegacion} onVerUsuario={manejarVerUsuario} />
      )}

      {pantalla === "chats" && usuarioActual && (
        <Chats
          onNavegar={manejarNavegacion}
          onVerUsuario={manejarVerUsuario}
          chatInicial={chatInicial}
          onVerGrupo={(grupo) => abrirGrupoConConcierto(grupo, "chats")}
          onAbrirMomento={abrirMomento}
        />
      )}

      {pantalla === "momento" && idMomento && usuarioActual && (
        <MomentoDetalle
          key={idMomento}
          idMomento={idMomento}
          onVolver={() => setPantalla(pantallaAntesDeMomento)}
          onNavegar={manejarNavegacion}
          onVerUsuario={manejarVerUsuario}
          onIngresarConcierto={manejarEntrarConcierto}
        />
      )}

      {pantalla === "notificaciones" && usuarioActual && (
        <Notificaciones
          onVolver={() => manejarNavegacion("home")}
          onNavegar={manejarNavegacion}
          onVerMas={manejarVerMasNotificacion}
        />
      )}

      {pantalla === "concierto" && concierto && usuarioActual && (
        <Concierto
          concierto={concierto}
          onCrearGrupo={() => setPantalla("crearGrupo")}
          onNavegar={manejarNavegacion}
          onVolver={() => manejarNavegacion("home")}
          onAbrirGrupo={(grupo) => {
            setGrupoSeleccionado(grupo);
            setPantallaAntesDeGrupo("concierto");
            setPantalla("infoGrupo");
          }}
          onVerFansUnidos={() => setPantalla("fansUnidos")}
        />
      )}

      {pantalla === "crearGrupo" && concierto && usuarioActual && (
        <CrearGrupo
          concierto={concierto}
          onVolver={() => setPantalla("concierto")}
          onGrupoCreado={async () => {
            await recargarDatos();
            setPantalla("concierto");
          }}
        />
      )}

      {pantalla === "infoGrupo" && grupoSeleccionado && concierto && (
        <InfoGrupo
          grupo={grupoSeleccionado}
          concierto={concierto}
          onNavegar={manejarNavegacion}
          onVolver={volverPantallaAnterior}
          onGrupoEliminado={async () => {
            setGrupoSeleccionado(null);
            await recargarDatos();
            setPantalla("concierto");
          }}
          onVerFansConfirmados={() => setPantalla("fansConfirmadosGrupo")}
          onAbrirChat={() => manejarAbrirChatGrupo(grupoSeleccionado.id_grupo)}
        />
      )}

      {pantalla === "fansConfirmadosGrupo" && grupoSeleccionado && (
        <FansUnidosLista
          fans={(grupoSeleccionado.usuarios || []).map(
            (u) => concierto?.usuarios?.find((c) => c.id_usuario === u.id_usuario) || u
          )}
          cantidadFans={(grupoSeleccionado.usuarios || []).length}
          titulo="Fans confirmados"
          subtitulo={`${(grupoSeleccionado.usuarios || []).length} personas confirmaron su asistencia a este grupo`}
          onVolver={() => setPantalla("infoGrupo")}
          onVerUsuario={manejarVerUsuario}
          onCambioAmistad={actualizarAmistadFan}
          onEnviarMensaje={manejarEnviarMensaje}
        />
      )}
    </>
  );
}

export default App;