import { useEffect, useState } from "react";
import "./perfil.css";
import { supabase } from "../../supabase";
import Footer from "../generales/Footer";
import HeaderPerfil from "./headerPerfil";
import StatsPerfil from "./statsPerfil";
import GenerosPerfil from "./generosPerfil";
import VibraConcierto from "./vibraConcierto";
import HighlightsPerfil from "./highlightsPerfil";
import { idDeGenero, nombreDeGenero } from "../../utils/generos";

// Mismos valores que usa Registro3 para usuario.estilo_asistencia:
// no son datos inventados, son el vocabulario real ya persistido en esa columna.
const AMBIENTES_CONCIERTO = [
  {
    id: "pogo",
    nombre: "Pogos, campos",
    descripcion: "Mucha energía, sudor y movimiento.",
    icono: "☍",
  },
  {
    id: "tranquilo",
    nombre: "Platea",
    descripcion: "Sentado y relajado con una bebida.",
    icono: "▣",
  },
  {
    id: "campo",
    nombre: "Primera Fila",
    descripcion: "Ojos en el escenario, cantando cada palabra.",
    icono: "★",
  },
];

function Perfil({
  usuarioActual,
  usuarioPerfil,
  isOwnProfile = true,
  onEditarGeneros,
  onNavegar,
  onUsuarioActualizado,
}) {
  const usuarioBase = usuarioPerfil || usuarioActual;

  // La foto se actualiza optimistamente acá y también se propaga hacia
  // arriba (onUsuarioActualizado) para que el resto de la app la vea.
  const [fotoLocal, setFotoLocal] = useState(null);
  const usuario = fotoLocal
    ? { ...usuarioBase, fotoperfil: fotoLocal }
    : usuarioBase;

  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState({ conciertos: 0, grupos: 0, amigos: 0 });
  const [generosSeleccionadosIds, setGenerosSeleccionadosIds] = useState([]);
  const [catalogoGeneros, setCatalogoGeneros] = useState([]);
  const [vibraActual, setVibraActual] = useState(usuarioBase?.estilo_asistencia || "");
  const [highlights, setHighlights] = useState([]);
  const [highlightsError, setHighlightsError] = useState("");
  const [subiendoHighlight, setSubiendoHighlight] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [estadoAmistad] = useState("conectar");

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
    ]);

    setCargando(false);
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
    const [{ count: conciertos, error: errorConciertos }, { count: grupos, error: errorGrupos }] =
      await Promise.all([
        supabase
          .from("usuarios_conciertos")
          .select("*", { count: "exact", head: true })
          .eq("id_usuario", usuario.id_usuario),
        supabase
          .from("grupos_usuarios")
          .select("*", { count: "exact", head: true })
          .eq("id_usuario", usuario.id_usuario),
      ]);

    if (errorConciertos) console.error("Error contando conciertos:", errorConciertos);
    if (errorGrupos) console.error("Error contando grupos:", errorGrupos);

    // No existe todavía una tabla de amistades: hasta que se cree, "Amigos" queda en 0.
    setEstadisticas({
      conciertos: conciertos || 0,
      grupos: grupos || 0,
      amigos: 0,
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
    if (!isOwnProfile) return;

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
        onAccionAmistad={() => {}}
        onSubirFoto={manejarSubirFoto}
        subiendoFoto={subiendoFoto}
      />

      <div className="perfilContenido">
        <StatsPerfil estadisticas={estadisticas} />

        <GenerosPerfil
          generos={generosConNombre}
          isOwnProfile={isOwnProfile}
          onEditar={onEditarGeneros}
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
    </div>
  );
}

export default Perfil;
