import { useState } from "react";
import Concierto from "./componentes/concierto/Concierto";
import InfoGrupo from "./componentes/infoGrupos/infoGrupo";
import IniciarSesionRegistrarse from "./componentes/Login/IniciarSesion-Registrarse/IniciarSesionRegistrarse";
import Registro1 from "./componentes/Login/Registro1/Registro1";
import Registro2 from "./componentes/Login/Registro2/Registro2";
import Registro3 from "./componentes/Login/Registro3/Registro3";
import { supabase } from "./supabase";

function App() {
  const [pantalla, setPantalla] = useState("login");
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [concierto, setConcierto] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorTexto, setErrorTexto] = useState("");

  async function cargarDatos(idUsuario) {
    setCargando(true);
    setErrorTexto("");

    const { data: usuarioConcierto, error: errorUsuarioConcierto } =
      await supabase
        .from("usuarios_conciertos")
        .select("*")
        .eq("id_usuario", idUsuario)
        .limit(1)
        .maybeSingle();

    if (errorUsuarioConcierto) {
      setErrorTexto(
        "Error en usuarios_conciertos: " + errorUsuarioConcierto.message
      );
      setCargando(false);
      return false;
    }

    if (!usuarioConcierto) {
      setErrorTexto(
        "Este usuario no tiene conciertos cargados en usuarios_conciertos."
      );
      setCargando(false);
      return false;
    }

    const { data: conciertoData, error: errorConcierto } = await supabase
      .from("concierto")
      .select("*")
      .eq("id_concierto", usuarioConcierto.id_concierto)
      .maybeSingle();

    if (errorConcierto) {
      setErrorTexto("Error en concierto: " + errorConcierto.message);
      setCargando(false);
      return false;
    }

    if (!conciertoData) {
      setErrorTexto(
        "No existe el concierto con id " + usuarioConcierto.id_concierto
      );
      setCargando(false);
      return false;
    }

    const { data: artistaData } = await supabase
      .from("artista")
      .select("*")
      .eq("id_artista", conciertoData.id_artista)
      .maybeSingle();

    const { data: estadioData } = await supabase
      .from("estadio")
      .select("*")
      .eq("id_estadio", conciertoData.id_estadio)
      .maybeSingle();

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
        const { data: relacionesGrupo } = await supabase
          .from("grupos_usuarios")
          .select("*")
          .eq("id_grupo", grupo.id_grupo);

        const usuarios = await Promise.all(
          (relacionesGrupo || []).map(async (relacion) => {
            const { data: usuarioData } = await supabase
              .from("usuario")
              .select("*")
              .eq("id_usuario", relacion.id_usuario)
              .maybeSingle();

            return {
              id_usuario: usuarioData?.id_usuario,
              nombre: usuarioData?.nombre || "Usuario",
              foto_perfil:
                usuarioData?.fotoperfil ||
                "https://i.pinimg.com/originals/31/ec/2c/31ec2ce212492e600b8de27f38846ed7.jpg",
            };
          })
        );

        return {
          ...grupo,
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
          venueImage: "",
        }),
        imagen:
          estadioData?.venueImage ||
          "https://images.unsplash.com/photo-1577223625816-7546f13df25d",
      },

      imagen:
        conciertoData.imagenConcierto ||
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",

      hora: conciertoData.hora || "21:00",

      grupos: gruposConUsuarios,
      usuarios: usuariosDelConcierto,
      asistentes: usuariosDelConcierto.length,
    };

    setConcierto(conciertoFinal);
    setCargando(false);
    return true;
  }

  async function manejarIngreso(usuario) {
    setUsuarioActual(usuario);

    const pudoCargar = await cargarDatos(usuario.id_usuario);

    if (pudoCargar) {
      setPantalla("concierto");
    }
  }

  if (
    pantalla !== "login" &&
    pantalla !== "registro1" &&
    pantalla !== "registro2" &&
    pantalla !== "registro3" &&
    cargando
  ) {
    return <p style={{ padding: 20 }}>Cargando concierto...</p>;
  }

  if (
    pantalla !== "login" &&
    pantalla !== "registro1" &&
    pantalla !== "registro2" &&
    pantalla !== "registro3" &&
    !concierto
  ) {
    return <pre style={{ padding: 20 }}>{errorTexto}</pre>;
  }

  return (
    <>
      {pantalla === "login" && (
        <IniciarSesionRegistrarse
          onIngresar={manejarIngreso}
          onRegistrarse={() => {
            setPantalla("registro1");
          }}
        />
      )}

      {pantalla === "registro1" && (
        <Registro1
          onVolver={() => {
            setPantalla("login");
          }}
          onSiguiente={() => {
            setPantalla("registro2");
          }}
        />
      )}

      {pantalla === "registro2" && (
        <Registro2
          onVolver={() => {
            setPantalla("registro1");
          }}
          onSiguiente={() => {
            setPantalla("registro3");
          }}
        />
      )}

      {pantalla === "registro3" && (
        <Registro3
          onVolver={() => {
            setPantalla("registro2");
          }}
          onFinalizar={() => {
            setPantalla("login");
          }}
        />
      )}

      {pantalla === "concierto" && concierto && usuarioActual && (
        <Concierto
          concierto={concierto}
          usuarioActual={usuarioActual}
          onAbrirGrupo={(grupo) => {
            setGrupoSeleccionado(grupo);
            setPantalla("infoGrupo");
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