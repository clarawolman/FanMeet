/*import { useState } from "react";

import Concierto from "./componentes/concierto/Concierto";
import InfoGrupo from "./componentes/infoGrupos/infoGrupo";
import CrearGrupo from "./componentes/crearGrupo/CrearGrupo";

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
          foto:
            grupo.foto ||
            grupo.imagen ||
            grupo.imagenGrupo ||
            "",
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

  async function manejarIngreso(usuario) {
    setUsuarioActual(usuario);

    const pudoCargar = await cargarDatos(usuario.id_usuario);

    if (pudoCargar) {
      setPantalla("concierto");
    }
  }

  async function recargarDatos() {
    if (!usuarioActual) return;

    await cargarDatos(usuarioActual.id_usuario);
  }

  const esPantallaLogin =
    pantalla === "login" ||
    pantalla === "registro1" ||
    pantalla === "registro2" ||
    pantalla === "registro3";

  if (!esPantallaLogin && cargando) {
    return <p style={{ padding: 20 }}>Cargando concierto...</p>;
  }

  if (!esPantallaLogin && !concierto) {
    return <pre style={{ padding: 20 }}>{errorTexto}</pre>;
  }

  return (
    <>
      {pantalla === "login" && (
        <IniciarSesionRegistrarse
          onIngresar={manejarIngreso}
          onRegistrarse={() => setPantalla("registro1")}
        />
      )}

      {pantalla === "registro1" && (
        <Registro1
          onVolver={() => setPantalla("login")}
          onSiguiente={() => setPantalla("registro2")}
        />
      )}

      {pantalla === "registro2" && (
        <Registro2
          onVolver={() => setPantalla("registro1")}
          onSiguiente={() => setPantalla("registro3")}
        />
      )}

      {pantalla === "registro3" && (
        <Registro3
          onVolver={() => setPantalla("registro2")}
          onFinalizar={() => setPantalla("login")}
        />
      )}

      {pantalla === "concierto" && concierto && usuarioActual && (
        <Concierto
          concierto={concierto}
          usuarioActual={usuarioActual}
          onCrearGrupo={() => setPantalla("crearGrupo")}
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

/*import { useEffect, useState } from "react";
import Concierto from "./componentes/concierto/Concierto";
import InfoGrupo from "./componentes/infoGrupos/infoGrupo";
import CrearGrupo from "./componentes/crearGrupo/CrearGrupo";

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
          foto:
            grupo.foto ||
            grupo.imagen ||
            grupo.imagenGrupo ||
            "",
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

  async function manejarIngreso(usuario) {
    setUsuarioActual(usuario);

    const pudoCargar = await cargarDatos(usuario.id_usuario);

    if (pudoCargar) {
      setPantalla("concierto");
    }
  }

  async function recargarDatos() {
    if (!usuarioActual) return;

    await cargarDatos(usuarioActual.id_usuario);
  }

  const esPantallaLogin =
    pantalla === "login" ||
    pantalla === "registro1" ||
    pantalla === "registro2" ||
    pantalla === "registro3";

  if (!esPantallaLogin && cargando) {
    return <p style={{ padding: 20 }}>Cargando concierto...</p>;
  }

  if (!esPantallaLogin && !concierto) {
    return <pre style={{ padding: 20 }}>{errorTexto}</pre>;
  }

  return (
    <>
      {pantalla === "login" && (
        <IniciarSesionRegistrarse
          onIngresar={manejarIngreso}
          onRegistrarse={() => setPantalla("registro1")}
        />
      )}

      {pantalla === "registro1" && (
        <Registro1
          onVolver={() => setPantalla("login")}
          onSiguiente={() => setPantalla("registro2")}
        />
      )}

      {pantalla === "registro2" && (
        <Registro2
          onVolver={() => setPantalla("registro1")}
          onSiguiente={() => setPantalla("registro3")}
        />
      )}

      {pantalla === "registro3" && (
        <Registro3
          onVolver={() => setPantalla("registro2")}
          onFinalizar={() => setPantalla("login")}
        />
      )}

      {pantalla === "concierto" && concierto && usuarioActual && (
        <Concierto
          concierto={concierto}
          usuarioActual={usuarioActual}
          onCrearGrupo={() => setPantalla("crearGrupo")}
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

/*import { useEffect, useState } from "react";
import Concierto from "./componentes/concierto/Concierto";
import InfoGrupo from "./componentes/infoGrupos/infoGrupo";
import CrearGrupo from "./componentes/crearGrupo/CrearGrupo";
import { supabase } from "./supabase";

const ID_USUARIO_ACTUAL = 1;

function App() {
  const [pantalla, setPantalla] = useState("concierto");
  const [concierto, setConcierto] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorTexto, setErrorTexto] = useState("");

  async function cargarDatos() {
    setCargando(true);
    setErrorTexto("");

    const { data: usuarioConcierto, error: errorUsuarioConcierto } =
      await supabase
        .from("usuarios_conciertos")
        .select("*")
        .eq("id_usuario", ID_USUARIO_ACTUAL)
        .limit(1)
        .maybeSingle();

    if (errorUsuarioConcierto) {
      setErrorTexto("Error en usuarios_conciertos: " + errorUsuarioConcierto.message);
      setCargando(false);
      return;
    }

    if (!usuarioConcierto) {
      setErrorTexto("El usuario no tiene conciertos en usuarios_conciertos.");
      setCargando(false);
      return;
    }

    const { data: conciertoData, error: errorConcierto } = await supabase
      .from("concierto")
      .select("*")
      .eq("id_concierto", usuarioConcierto.id_concierto)
      .maybeSingle();

    if (errorConcierto) {
      setErrorTexto("Error en concierto: " + errorConcierto.message);
      setCargando(false);
      return;
    }

    if (!conciertoData) {
      setErrorTexto("No existe el concierto con id " + usuarioConcierto.id_concierto);
      setCargando(false);
      return;
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
      return;
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
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  if (cargando) {
    return <p style={{ padding: 20 }}>Cargando concierto...</p>;
  }

  if (!concierto) {
    return <pre style={{ padding: 20 }}>{errorTexto}</pre>;
  }

  return (
    <>
      {pantalla === "concierto" && (
        <Concierto
          concierto={concierto}
          onCrearGrupo={() => setPantalla("crearGrupo")}
          onAbrirGrupo={(grupo) => {
            setGrupoSeleccionado(grupo);
            setPantalla("infoGrupo");
          }}
        />
      )}

      {pantalla === "crearGrupo" && (
        <CrearGrupo
          concierto={concierto}
          idUsuarioActual={ID_USUARIO_ACTUAL}
          onVolver={() => setPantalla("concierto")}
          onGrupoCreado={async () => {
            await cargarDatos();
            setPantalla("concierto");
          }}
        />
      )}

      {pantalla === "infoGrupo" && grupoSeleccionado && (
        <InfoGrupo
          grupo={grupoSeleccionado}
          concierto={concierto}
          onVolver={() => setPantalla("concierto")}
        />
      )}
    </>
  );
}

export default App;*/
import { useEffect, useState } from "react";
import Concierto from "./componentes/concierto/Concierto";
import InfoGrupo from "./componentes/infoGrupos/infoGrupo";
import CrearGrupo from "./componentes/crearGrupo/CrearGrupo";
import { supabase } from "./supabase";

const ID_USUARIO_ACTUAL = 1;

function App() {
  const [pantalla, setPantalla] = useState("concierto");
  const [concierto, setConcierto] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorTexto, setErrorTexto] = useState("");

  async function cargarDatos() {
    setCargando(true);
    setErrorTexto("");

    const { data: usuarioConcierto, error: errorUsuarioConcierto } =
      await supabase
        .from("usuarios_conciertos")
        .select("*")
        .eq("id_usuario", ID_USUARIO_ACTUAL)
        .limit(1)
        .maybeSingle();

    if (errorUsuarioConcierto) {
      setErrorTexto("Error en usuarios_conciertos: " + errorUsuarioConcierto.message);
      setCargando(false);
      return;
    }

    if (!usuarioConcierto) {
      setErrorTexto("El usuario no tiene conciertos en usuarios_conciertos.");
      setCargando(false);
      return;
    }

    const { data: conciertoData, error: errorConcierto } = await supabase
      .from("concierto")
      .select("*")
      .eq("id_concierto", usuarioConcierto.id_concierto)
      .maybeSingle();

    if (errorConcierto) {
      setErrorTexto("Error en concierto: " + errorConcierto.message);
      setCargando(false);
      return;
    }

    if (!conciertoData) {
      setErrorTexto("No existe el concierto con id " + usuarioConcierto.id_concierto);
      setCargando(false);
      return;
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
      return;
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
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  if (cargando) {
    return <p style={{ padding: 20 }}>Cargando concierto...</p>;
  }

  if (!concierto) {
    return <pre style={{ padding: 20 }}>{errorTexto}</pre>;
  }

  return (
    <>
      {pantalla === "concierto" && (
        <Concierto
          concierto={concierto}
          onCrearGrupo={() => setPantalla("crearGrupo")}
          onAbrirGrupo={(grupo) => {
            setGrupoSeleccionado(grupo);
            setPantalla("infoGrupo");
          }}
        />
      )}

      {pantalla === "crearGrupo" && (
        <CrearGrupo
          concierto={concierto}
          idUsuarioActual={ID_USUARIO_ACTUAL}
          onVolver={() => setPantalla("concierto")}
          onGrupoCreado={async () => {
            await cargarDatos();
            setPantalla("concierto");
          }}
        />
      )}

      {pantalla === "infoGrupo" && grupoSeleccionado && (
        <InfoGrupo
          grupo={grupoSeleccionado}
          concierto={concierto}
          onVolver={() => setPantalla("concierto")}
        />
      )}
    </>
  );
}

export default App;