import { useContext, useState } from "react";

import CargandoPantalla from "./componentes/generales/CargandoPantalla";
import Concierto from "./componentes/concierto/Concierto";
import InfoGrupo from "./componentes/infoGrupos/infoGrupo";
import CrearGrupo from "./componentes/crearGrupo/CrearGrupo";
import Home from "./componentes/home/Home";
import IniciarSesionRegistrarse from "./componentes/Login/IniciarSesion-Registrarse/IniciarSesionRegistrarse";
import Registro1 from "./componentes/Login/Registro1/Registro1";
import Registro2 from "./componentes/Login/Registro2/Registro2";
import Registro3 from "./componentes/Login/Registro3/Registro3";
import MisEventos from "./componentes/misEventos/MisEventos";
import MisGrupos from "./componentes/misGrupos/MisGrupos";
import Perfil from "./componentes/perfil/perfil";
import EditarGeneros from "./componentes/editarGeneros/EditarGeneros";
import FansUnidosLista from "./componentes/concierto/FansUnidosLista";
import Notificaciones from "./componentes/notificaciones/Notificaciones";
import Chats from "./componentes/chats/Chats";
import Descubrir from "./componentes/descubrir/Descubrir";

import { authService } from "./services/authService";
import { usuariosService } from "./services/usuariosService";
import { conciertosService } from "./services/conciertosService";
import { spotifyService } from "./services/spotifyService";
import { UsuarioContext } from "./context/UsuarioContext";

function App() {
  const [pantalla, setPantalla] = useState("login");

  // El usuario logueado vive en UsuarioContext (src/context/UsuarioContext.jsx).
  const { usuarioActual, setUsuarioActual } = useContext(UsuarioContext);
  const [datosRegistro, setDatosRegistro] = useState({});
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

  const [cargando, setCargando] = useState(false);
  const [errorTexto, setErrorTexto] = useState("");

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
    setPantalla("home");
  }

  async function manejarCerrarSesion() {
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
    try {
      const usuario = await usuariosService.obtenerPerfil(idUsuario);
      setUsuarioVisitado(usuario);
      if (pantalla !== "perfilAjeno") setPantallaAntesDePerfil(pantalla);
      setPantalla("perfilAjeno");
    } catch (error) {
      console.error("Error cargando usuario:", error);
    }
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
    if (notificacion.tipo === "concierto_unido" && notificacion.id_concierto) {
      await manejarEntrarConcierto(notificacion.id_concierto);
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
    let usuarioCreado = await authService.registro(datosSinFoto);

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
    setCargando(false);
    setPantalla("home");
  } catch (error) {
    setErrorTexto(error.message || "Error al registrar usuario");
    setCargando(false);
  }
}

  const esPantallaLogin =
    pantalla === "login" ||
    pantalla === "registro1" ||
    pantalla === "registro2" ||
    pantalla === "registro3";

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
    pantalla !== "descubrir"
  ) {
    return <pre style={{ padding: 20 }}>{errorTexto}</pre>;
  }

  return (
    <>
      {errorTexto && esPantallaLogin && (
        <pre style={{ padding: 20, color: "crimson" }}>{errorTexto}</pre>
      )}

      {pantalla === "login" && (
        <IniciarSesionRegistrarse
          onIngresar={manejarIngreso}
          onRegistrarse={() => setPantalla("registro1")}
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