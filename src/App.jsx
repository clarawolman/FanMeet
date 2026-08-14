import { useState } from "react";

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

import { authService } from "./services/authService";
import { usuariosService } from "./services/usuariosService";
import { conciertosService } from "./services/conciertosService";

function App() {
  const [pantalla, setPantalla] = useState("login");

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [datosRegistro, setDatosRegistro] = useState({});
  const [concierto, setConcierto] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [usuarioVisitado, setUsuarioVisitado] = useState(null);

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

    setPantalla(destino);
  }

  async function manejarVerUsuario(idUsuario) {
    try {
      const usuario = await usuariosService.obtenerPerfil(idUsuario);
      setUsuarioVisitado(usuario);
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
    setPantalla(concierto ? "concierto" : "misGrupos");
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
  try {
    const usuarioCreado = await authService.registro(datosFinales);
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
    return <p style={{ padding: 20 }}>Cargando concierto...</p>;
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
    pantalla !== "perfilAjeno" &&
    pantalla !== "notificaciones"
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
    usuarioActual={usuarioActual}
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
    usuarioActual={usuarioActual}
    onVolver={() => setPantalla("misEventos")}
    onNavegar={setPantalla}
    onAbrirGrupo={(grupo) => {
      setGrupoSeleccionado(grupo);
      setPantalla("infoGrupo");
    }}
  />
)}

      {pantalla === "perfil" && usuarioActual && (
        <Perfil
          usuarioActual={usuarioActual}
          isOwnProfile={true}
          onEditarGeneros={() => setPantalla("editarGeneros")}
          onNavegar={manejarNavegacion}
          onUsuarioActualizado={setUsuarioActual}
          onCerrarSesion={manejarCerrarSesion}
          onVerUsuario={manejarVerUsuario}
        />
      )}

      {pantalla === "editarGeneros" && usuarioActual && (
        <EditarGeneros
          usuarioActual={usuarioActual}
          onVolver={() => setPantalla("perfil")}
        />
      )}

      {pantalla === "perfilAjeno" && usuarioVisitado && usuarioActual && (
        <Perfil
          usuarioActual={usuarioActual}
          usuarioPerfil={usuarioVisitado}
          isOwnProfile={false}
          onNavegar={manejarNavegacion}
          onVolver={() => setPantalla("fansUnidos")}
          onVerUsuario={manejarVerUsuario}
        />
      )}

      {pantalla === "fansUnidos" && concierto && (
        <FansUnidosLista
          fans={concierto.usuarios}
          cantidadFans={concierto.cantidadFans || concierto.asistentes || 0}
          usuarioActualId={usuarioActual?.id_usuario}
          onVolver={() => setPantalla("concierto")}
          onVerUsuario={manejarVerUsuario}
        />
      )}

      {pantalla === "home" && usuarioActual && (
        <Home
          usuarioActual={usuarioActual}
          onEntrarConcierto={manejarEntrarConcierto}
          onNavegar={manejarNavegacion}
        />
      )}

      {pantalla === "notificaciones" && usuarioActual && (
        <Notificaciones
          usuarioActual={usuarioActual}
          onVolver={() => manejarNavegacion("home")}
          onNavegar={manejarNavegacion}
          onVerMas={manejarVerMasNotificacion}
        />
      )}

      {pantalla === "concierto" && concierto && usuarioActual && (
        <Concierto
          concierto={concierto}
          usuarioActual={usuarioActual}
          onCrearGrupo={() => setPantalla("crearGrupo")}
          onNavegar={manejarNavegacion}
          onVolver={() => manejarNavegacion("home")}
          onAbrirGrupo={(grupo) => {
            setGrupoSeleccionado(grupo);
            setPantalla("infoGrupo");
          }}
          onVerFansUnidos={() => setPantalla("fansUnidos")}
        />
      )}

      {pantalla === "crearGrupo" && concierto && usuarioActual && (
        <CrearGrupo
          concierto={concierto}
          idUsuarioActual={usuarioActual.id_usuario}
          usuarioActual={usuarioActual}
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
          usuarioActual={usuarioActual}
          onNavegar={manejarNavegacion}
          onVolver={volverPantallaAnterior}
          onGrupoEliminado={async () => {
            setGrupoSeleccionado(null);
            await recargarDatos();
            setPantalla("concierto");
          }}
        />
      )}
    </>
  );
}

export default App;