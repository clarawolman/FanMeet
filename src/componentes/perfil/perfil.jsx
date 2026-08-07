import { useEffect, useState } from "react";
import "./perfil.css";
import { supabase } from "../../supabase";
import Footer from "../generales/Footer";
import HeaderPerfil from "./headerPerfil";
import StatsPerfil from "./statsPerfil";
import GenerosPerfil from "./generosPerfil";
import VibraConcierto from "./vibraConcierto";
import HighlightsPerfil from "./highlightsPerfil";
import EditarGeneros from "../editarGeneros/EditarGeneros";
import ListaAmigosPerfil from "./listaAmigosPerfil";
import { idDeGenero, nombreDeGenero } from "../../utils/generos";
import { IconoPogo, IconoSentado, IconoPrimeraFila } from "./vibraIconos";

// Mismos valores que usa Registro3 para usuario.estilo_asistencia:
// no son datos inventados, son el vocabulario real ya persistido en esa columna.
const AMBIENTES_CONCIERTO = [
  {
    id: "pogo",
    nombre: "Pogos, campos",
    descripcion: "Mucha energía, sudor y movimiento.",
    icono: <IconoPogo />,
  },
  {
    id: "tranquilo",
    nombre: "Platea",
    descripcion: "Sentado y relajado con una bebida.",
    icono: <IconoSentado />,
  },
  {
    id: "campo",
    nombre: "Primera Fila",
    descripcion: "Ojos en el escenario, cantando cada palabra.",
    icono: <IconoPrimeraFila />,
  },
];

function Perfil({
  usuarioActual,
  usuarioPerfil,
  isOwnProfile = true,
  onNavegar,
  onUsuarioActualizado,
  onVolver,
  onCerrarSesion,
  onVerUsuario,
}) {
  const usuarioBase = usuarioPerfil || usuarioActual;

  // La foto se actualiza optimistamente acá y también se propaga hacia
  // arriba (onUsuarioActualizado) para que el resto de la app la vea.
  const [fotoLocal, setFotoLocal] = useState(null);
  const usuario = fotoLocal
    ? { ...usuarioBase, fotoperfil: fotoLocal }
    : usuarioBase;

  const [mostrarEditorGeneros, setMostrarEditorGeneros] = useState(false);
  const [mostrarAmigos, setMostrarAmigos] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState({ conciertos: 0, grupos: 0, amigos: 0 });
  const [generosSeleccionadosIds, setGenerosSeleccionadosIds] = useState([]);
  const [catalogoGeneros, setCatalogoGeneros] = useState([]);
  const [vibraActual, setVibraActual] = useState(usuarioBase?.estilo_asistencia || "");
  const [highlights, setHighlights] = useState([]);
  const [highlightsError, setHighlightsError] = useState("");
  const [subiendoHighlight, setSubiendoHighlight] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [estadoAmistad, setEstadoAmistad] = useState("conectar");
  const [idAmistad, setIdAmistad] = useState(null);
  const [cargandoAmistad, setCargandoAmistad] = useState(false);

  useEffect(() => {
    if (usuario?.id_usuario) {
      cargarDatosPerfil();
    }
  }, [usuario?.id_usuario]);

  async function cargarDatosPerfil() {
    setCargando(true);

    await Promise.all([
      cargarEstadisticas(),
      cargarGeneros(),
      cargarCatalogoGeneros(),
      cargarHighlights(),
      cargarAmistad(),
    ]);

    setCargando(false);
  }

  async function cargarAmistad() {
    if (isOwnProfile || !usuarioActual?.id_usuario) return;

    const { data, error } = await supabase
      .from("amistad")
      .select("*")
      .or(
        `and(id_solicitante.eq.${usuarioActual.id_usuario},id_receptor.eq.${usuario.id_usuario}),and(id_solicitante.eq.${usuario.id_usuario},id_receptor.eq.${usuarioActual.id_usuario})`
      )
      .maybeSingle();

    if (error) {
      console.error("Error cargando estado de amistad:", error);
      return;
    }

    if (!data) {
      setEstadoAmistad("conectar");
      setIdAmistad(null);
      return;
    }

    setIdAmistad(data.id_amistad);

    if (data.estado === "aceptada") {
      setEstadoAmistad("amigos");
    } else if (data.id_solicitante === usuarioActual.id_usuario) {
      setEstadoAmistad("solicitudEnviada");
    } else {
      setEstadoAmistad("aceptarSolicitud");
    }
  }

  async function manejarAccionAmistad() {
    if (isOwnProfile || !usuarioActual?.id_usuario || cargandoAmistad) return;

    setCargandoAmistad(true);

    if (estadoAmistad === "conectar") {
      const { data, error } = await supabase
        .from("amistad")
        .insert([
          {
            id_solicitante: usuarioActual.id_usuario,
            id_receptor: usuario.id_usuario,
          },
        ])
        .select()
        .single();

      setCargandoAmistad(false);

      if (error) {
        alert("No se pudo enviar la solicitud: " + error.message);
        return;
      }

      setIdAmistad(data.id_amistad);
      setEstadoAmistad("solicitudEnviada");
      return;
    }

    if (estadoAmistad === "aceptarSolicitud" && idAmistad) {
      const { error } = await supabase
        .from("amistad")
        .update({ estado: "aceptada" })
        .eq("id_amistad", idAmistad);

      setCargandoAmistad(false);

      if (error) {
        alert("No se pudo aceptar la solicitud: " + error.message);
        return;
      }

      setEstadoAmistad("amigos");
      return;
    }

    setCargandoAmistad(false);
  }

  async function cargarCatalogoGeneros() {
    const { data, error } = await supabase.from("estilo_musical").select("*");

    if (error) {
      console.error("Error cargando catálogo de géneros:", error);
      setCatalogoGeneros([]);
      return;
    }

    setCatalogoGeneros(data || []);
  }

  async function cargarEstadisticas() {
    const [
      { count: conciertos, error: errorConciertos },
      { count: grupos, error: errorGrupos },
      { count: amigos, error: errorAmigos },
    ] = await Promise.all([
      supabase
        .from("usuarios_conciertos")
        .select("*", { count: "exact", head: true })
        .eq("id_usuario", usuario.id_usuario),
      supabase
        .from("grupos_usuarios")
        .select("*", { count: "exact", head: true })
        .eq("id_usuario", usuario.id_usuario),
      supabase
        .from("amistad")
        .select("*", { count: "exact", head: true })
        .eq("estado", "aceptada")
        .or(`id_solicitante.eq.${usuario.id_usuario},id_receptor.eq.${usuario.id_usuario}`),
    ]);

    if (errorConciertos) console.error("Error contando conciertos:", errorConciertos);
    if (errorGrupos) console.error("Error contando grupos:", errorGrupos);
    if (errorAmigos) console.error("Error contando amigos:", errorAmigos);

    setEstadisticas({
      conciertos: conciertos || 0,
      grupos: grupos || 0,
      amigos: amigos || 0,
    });
  }

  async function cargarGeneros() {
    const { data, error } = await supabase
      .from("estilo_musical_usuario")
      .select("id_estilo")
      .eq("id_usuario", usuario.id_usuario);

    if (error) {
      console.error("Error cargando géneros del usuario:", error);
      setGenerosSeleccionadosIds([]);
      return;
    }

    setGenerosSeleccionadosIds((data || []).map((fila) => fila.id_estilo));
  }

  async function cargarHighlights() {
    const { data, error } = await supabase
      .from("highlight")
      .select("*")
      .eq("id_usuario", usuario.id_usuario)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando highlights:", error);
      setHighlights([]);
      setHighlightsError(error.message);
      return;
    }

    setHighlightsError("");
    setHighlights(data || []);
  }

  async function manejarSeleccionarVibra(idVibra) {
    if (!isOwnProfile || idVibra === vibraActual) return;

    const anterior = vibraActual;
    setVibraActual(idVibra);

    const { error } = await supabase
      .from("usuario")
      .update({ estilo_asistencia: idVibra })
      .eq("id_usuario", usuario.id_usuario);

    if (error) {
      console.error("Error actualizando vibra de concierto:", error);
      setVibraActual(anterior);
      alert("No se pudo actualizar tu vibra: " + error.message);
    }
  }

  async function manejarSubirHighlight(archivo) {
    if (!isOwnProfile || highlights.length >= 4) return;

    setSubiendoHighlight(true);

    const nombreArchivo = `${usuario.id_usuario}/${Date.now()}-${archivo.name}`;

    const { error: errorSubida } = await supabase.storage
      .from("highlights")
      .upload(nombreArchivo, archivo);

    if (errorSubida) {
      alert("No se pudo subir la imagen: " + errorSubida.message);
      setSubiendoHighlight(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("highlights")
      .getPublicUrl(nombreArchivo);

    const { error: errorInsert } = await supabase.from("highlight").insert([
      {
        id_usuario: usuario.id_usuario,
        url_imagen: urlData.publicUrl,
      },
    ]);

    if (errorInsert) {
      alert("No se pudo guardar el highlight: " + errorInsert.message);
      setSubiendoHighlight(false);
      return;
    }

    await cargarHighlights();
    setSubiendoHighlight(false);
  }

  async function manejarSubirFoto(archivo) {
    if (!isOwnProfile) return;

    setSubiendoFoto(true);

    const nombreArchivo = `${usuario.id_usuario}/${Date.now()}-${archivo.name}`;

    const { error: errorSubida } = await supabase.storage
      .from("avatars")
      .upload(nombreArchivo, archivo);

    if (errorSubida) {
      alert("No se pudo subir la foto: " + errorSubida.message);
      setSubiendoFoto(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(nombreArchivo);

    const { error: errorUpdate } = await supabase
      .from("usuario")
      .update({ fotoperfil: urlData.publicUrl })
      .eq("id_usuario", usuario.id_usuario);

    if (errorUpdate) {
      alert("No se pudo guardar la foto: " + errorUpdate.message);
      setSubiendoFoto(false);
      return;
    }

    setFotoLocal(urlData.publicUrl);
    onUsuarioActualizado?.({ ...usuarioBase, fotoperfil: urlData.publicUrl });
    setSubiendoFoto(false);
  }

  const generosConNombre = generosSeleccionadosIds.map((idEstilo) => {
    const genero = catalogoGeneros.find(
      (item) => String(idDeGenero(item)) === String(idEstilo)
    );

    return {
      id: idEstilo,
      nombre: genero ? nombreDeGenero(genero) : `Género #${idEstilo}`,
    };
  });

  return (
    <div className="pantallaPerfil">
      <HeaderPerfil
        usuario={usuario}
        isOwnProfile={isOwnProfile}
        estadoAmistad={estadoAmistad}
        amistadDeshabilitada={
          cargandoAmistad || estadoAmistad === "solicitudEnviada" || estadoAmistad === "amigos"
        }
        onAccionAmistad={manejarAccionAmistad}
        onSubirFoto={manejarSubirFoto}
        subiendoFoto={subiendoFoto}
        onVolver={onVolver}
        onNavegar={onNavegar}
        onCerrarSesion={onCerrarSesion}
      />

      <div className="perfilContenido">
        <StatsPerfil
          estadisticas={estadisticas}
          onVerConciertos={() => onNavegar?.("misEventos")}
          onVerAmigos={() => setMostrarAmigos(true)}
          onVerGrupos={() => onNavegar?.("misGrupos")}
        />

        <GenerosPerfil
          generos={generosConNombre}
          isOwnProfile={isOwnProfile}
          onEditar={() => setMostrarEditorGeneros(true)}
        />

        <VibraConcierto
          vibras={AMBIENTES_CONCIERTO}
          vibraActual={vibraActual}
          isOwnProfile={isOwnProfile}
          onSeleccionar={manejarSeleccionarVibra}
        />

        <HighlightsPerfil
          highlights={highlights}
          isOwnProfile={isOwnProfile}
          subiendo={subiendoHighlight}
          error={highlightsError}
          onSubirHighlight={manejarSubirHighlight}
        />

        {cargando && <p className="perfilCargando">Cargando perfil...</p>}
      </div>

      <Footer onNavegar={onNavegar} pantallaActiva="perfil" />

      {mostrarEditorGeneros && (
        <div className="perfilOverlayPantalla">
          <EditarGeneros
            usuarioActual={usuario}
            onVolver={() => {
              setMostrarEditorGeneros(false);
              cargarGeneros();
            }}
          />
        </div>
      )}

      {mostrarAmigos && (
        <ListaAmigosPerfil
          usuario={usuario}
          onVolver={() => setMostrarAmigos(false)}
          onVerUsuario={(idUsuario) => {
            setMostrarAmigos(false);
            onVerUsuario?.(idUsuario);
          }}
        />
      )}
    </div>
  );
}

export default Perfil;
