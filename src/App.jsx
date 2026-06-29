import { useState } from "react";

import Concierto from "./componentes/concierto/Concierto";
import InfoGrupo from "./componentes/infoGrupos/infoGrupo";
import CrearGrupo from "./componentes/crearGrupo/CrearGrupo";
import Home from "./componentes/home/Home";
//import Footer from "./generales/Footer";
import IniciarSesionRegistrarse from "./componentes/Login/IniciarSesion-Registrarse/IniciarSesionRegistrarse";
import Registro1 from "./componentes/Login/Registro1/Registro1";
import Registro2 from "./componentes/Login/Registro2/Registro2";
import Registro3 from "./componentes/Login/Registro3/Registro3";
import MisEventos from "./componentes/misEventos/MisEventos";
import MisGrupos from "./componentes/misGrupos/MisGrupos";

import { supabase } from "./supabase";

function App() {
  const [pantalla, setPantalla] = useState("login");

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [datosRegistro, setDatosRegistro] = useState({});
  const [concierto, setConcierto] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [errorTexto, setErrorTexto] = useState("");
  
  

  async function cargarConciertoPorId(idConcierto) {
    setCargando(true);
    setErrorTexto("");

    const { data: conciertoData, error: errorConcierto } = await supabase
      .from("concierto")
      .select("*")
      .eq("id_concierto", idConcierto)      
      .maybeSingle();

    if (errorConcierto) {
      setErrorTexto("Error en concierto: " + errorConcierto.message);
      setCargando(false);
      return false;
    }

    if (!conciertoData) {
      setErrorTexto(
        "No existe el concierto con id " + idConcierto
      );
      setCargando(false);
      return false;
    }

    const { data: artistaData, error: errorArtista } = await supabase
      .from("artista")
      .select("*")
      .eq("id_artista", conciertoData.id_artista)
      .maybeSingle();

    if (errorArtista) {
      setErrorTexto("Error en artista: " + errorArtista.message);
      setCargando(false);
      return false;
    }

    const { data: estadioData, error: errorEstadio } = await supabase
      .from("estadio")
      .select("*")
      .eq("id_estadio", conciertoData.id_estadio)
      .maybeSingle();

    if (errorEstadio) {
      setErrorTexto("Error en estadio: " + errorEstadio.message);
      setCargando(false);
      return false;
    }

    const { data: gruposData, error: errorGrupos } = await supabase
      .from("grupo")
      .select("*")
      .eq("id_concierto", conciertoData.id_concierto);

    if (errorGrupos) {
      setErrorTexto("Error en grupo: " + errorGrupos.message);
      setCargando(false);
      return false;
    }

    const gruposConUsuarios = await Promise.all(
      (gruposData || []).map(async (grupo) => {
        const { data: relacionesGrupo, error: errorRelacionesGrupo } =
          await supabase
            .from("grupos_usuarios")
            .select("*")
            .eq("id_grupo", grupo.id_grupo);

        if (errorRelacionesGrupo) {
          console.error("Error en grupos_usuarios:", errorRelacionesGrupo);
        }

        const usuarios = await Promise.all(
          (relacionesGrupo || []).map(async (relacion) => {
            const { data: usuarioData, error: errorUsuario } = await supabase
              .from("usuario")
              .select("*")
              .eq("id_usuario", relacion.id_usuario)
              .maybeSingle();

            if (errorUsuario) {
              console.error("Error en usuario:", errorUsuario);
            }

            return {
              id_usuario: usuarioData?.id_usuario,
              nombre: usuarioData?.nombre || "Usuario",
              foto_perfil:
                usuarioData?.fotoperfil ||
                usuarioData?.foto_perfil ||
                "https://i.pinimg.com/originals/31/ec/2c/31ec2ce212492e600b8de27f38846ed7.jpg",
            };
          })
        );

        return {
          ...grupo,
          foto: grupo.foto || grupo.imagen || grupo.imagenGrupo || "",
          categoria: grupo.categoria,
          usuarios,
        };
      })
    );

    const usuariosDelConcierto = gruposConUsuarios.flatMap(
      (grupo) => grupo.usuarios
    );

    const conciertoFinal = {
      ...conciertoData,

      artista: artistaData || {
        id_artista: conciertoData.id_artista,
        nombre: "Artista",
      },

      estadio: {
        ...(estadioData || {
          id_estadio: conciertoData.id_estadio,
          nombre: "Estadio",
          direccion: "",
          ciudad: "",
        }),
        imagen:
          estadioData?.imagen ||
          estadioData?.venueImage ||
          estadioData?.foto ||
          "",
      },

      imagen:
        conciertoData.imagen ||
        conciertoData.imagenConcierto ||
        conciertoData.foto ||
        "",

      hora: conciertoData.hora || "",

      grupos: gruposConUsuarios,
      usuarios: usuariosDelConcierto,
      asistentes: usuariosDelConcierto.length,
    };

    setConcierto(conciertoFinal);
    setCargando(false);
    return true;
  }

  /*async function manejarIngreso(usuario) {
    setUsuarioActual(usuario);

    const pudoCargar = await cargarDatos(usuario.id_usuario);

    if (pudoCargar) {
      setPantalla("misEventos");
    }
  }*/
  async function manejarIngreso(usuario) {
    setUsuarioActual(usuario);
    setConcierto(null);
    setGrupoSeleccionado(null);
    setErrorTexto("");
    setPantalla("home");
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

  function manejarRegistro1(datosPaso1) {
    setDatosRegistro((datosAnteriores) => ({
      ...datosAnteriores,
      ...datosPaso1,
    }));

    setPantalla("registro2");
  }

  function manejarRegistro2(datosPaso2) {
    setDatosRegistro((datosAnteriores) => ({
      ...datosAnteriores,
      ...datosPaso2,
    }));

    setPantalla("registro3");
  }

  async function manejarFinalizarRegistro(datosPaso3) {
    setCargando(true);
    setErrorTexto("");

    const datosFinales = {
      ...datosRegistro,
      ...datosPaso3,
    };

    const fotoDefault =
      "https://i.pinimg.com/originals/31/ec/2c/31ec2ce212492e600b8de27f38846ed7.jpg";


const { data: usuarioCreado, error } = await supabase
  .from("usuario")
  .insert([
    {
      nombre: datosFinales.nombre,
      mail: datosFinales.mail,
      contrasena: datosFinales.contrasena,
      fechanac: datosFinales.fechanac,
      genero: datosFinales.genero,
      fotoperfil: datosFinales.previewFoto || fotoDefault,
      estilo_asistencia: datosFinales.estilo_asistencia,
    },
  ])
  .select()
  .single();

    if (error) {
      setErrorTexto("Error al registrar usuario: " + error.message);
      setCargando(false);
      return;
    }

    setUsuarioActual(usuarioCreado);
    setDatosRegistro({});
    setCargando(false);
    setPantalla("login");
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
    pantalla !== "concierto"
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
          onVolver={() => setPantalla("login")}
          onSiguiente={manejarRegistro1}
        />
      )}

      {pantalla === "registro2" && (
        <Registro2
          onVolver={() => setPantalla("registro1")}
          onSiguiente={manejarRegistro2}
        />
      )}

      {pantalla === "registro3" && (
        <Registro3
          onVolver={() => setPantalla("registro2")}
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
      />
    )}
       {pantalla === "misGrupos" && usuarioActual && (
  <MisGrupos
    usuarioActual={usuarioActual}
    onVolver={() => setPantalla("misEventos")}
    onAbrirGrupo={(grupo) => {
      setGrupoSeleccionado(grupo);
      setPantalla("infoGrupo");
    }}
  />
)}
      
      {pantalla === "home" && usuarioActual && (
        <Home
          usuarioActual={usuarioActual}
          onEntrarConcierto={manejarEntrarConcierto}
        />
      )}

      {pantalla === "concierto" && concierto && usuarioActual && (
        <Concierto
          concierto={concierto}
          usuarioActual={usuarioActual}
          onCrearGrupo={() => setPantalla("crearGrupo")}
          onNavegar={setPantalla}
          onAbrirGrupo={(grupo) => {
            setGrupoSeleccionado(grupo);
            setPantalla("infoGrupo");
          }}
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
          onVolver={() => setPantalla("concierto")}
        />
      )}
    </>
  );
}

export default App;