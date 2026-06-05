import { useEffect, useState } from "react";
import Concierto from "./componentes/concierto/Concierto";
import InfoGrupo from "./componentes/infoGrupos/infoGrupo";
import { supabase } from "./supabase";

const ID_USUARIO_ACTUAL = 1;

function App() {
  const [pantalla, setPantalla] = useState("concierto");
  const [concierto, setConcierto] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorTexto, setErrorTexto] = useState("");

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);

      const { data: usuarioActualData, error: errorUsuarioActual } =
        await supabase
          .from("usuario")
          .select("*")
          .eq("id_usuario", ID_USUARIO_ACTUAL)
          .maybeSingle();

      if (errorUsuarioActual) {
        setErrorTexto("Error en usuario: " + errorUsuarioActual.message);
        setCargando(false);
        return;
      }

      if (!usuarioActualData) {
        setErrorTexto("No existe el usuario con id " + ID_USUARIO_ACTUAL);
        setCargando(false);
        return;
      }

      setUsuarioActual(usuarioActualData);

      const { data: usuarioConcierto, error: errorUsuarioConcierto } =
        await supabase
          .from("usuarios_conciertos")
          .select("*")
          .eq("id_usuario", ID_USUARIO_ACTUAL)
          .limit(1)
          .maybeSingle();

      if (errorUsuarioConcierto) {
        setErrorTexto(
          "Error en usuarios_conciertos: " + errorUsuarioConcierto.message
        );
        setCargando(false);
        return;
      }

      if (!usuarioConcierto) {
        setErrorTexto(
          "El usuario 1 no tiene conciertos en usuarios_conciertos."
        );
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
        setErrorTexto(
          "No existe el concierto con id " + usuarioConcierto.id_concierto
        );
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
                  "https://i.pravatar.cc/100?img=5",
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
          }),
          imagen:
            estadioData?.imagen ||
            "https://images.unsplash.com/photo-1577223625816-7546f13df25d",
        },

        imagen:
          conciertoData.imagen ||
          "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",

        hora: conciertoData.hora || "21:00",

        grupos: gruposConUsuarios,
        usuarios: usuariosDelConcierto,
        asistentes: usuariosDelConcierto.length,
      };

      setConcierto(conciertoFinal);
      setCargando(false);
    }

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
          onAbrirGrupo={(grupo) => {
            setGrupoSeleccionado(grupo);
            setPantalla("infoGrupo");
          }}
        />
      )}

      {pantalla === "infoGrupo" && grupoSeleccionado && (
        <InfoGrupo
          grupo={grupoSeleccionado}
          concierto={concierto}
          usuario={usuarioActual}
          onVolver={() => setPantalla("concierto")}
        />
      )}
    </>
  );
}

export default App;