import { useEffect, useState } from "react";
import "./perfil.css";
import { usuariosService } from "../../services/usuariosService";
import { amistadService } from "../../services/amistadService";
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

    try {
      const { idAmistad: idAmistadCargado, estado } = await amistadService.obtenerEstado(
        usuario.id_usuario
      );
      setIdAmistad(idAmistadCargado);
      setEstadoAmistad(estado);
    } catch (error) {
      console.error("Error cargando estado de amistad:", error);
    }
  }

  async function manejarAccionAmistad() {
    if (isOwnProfile || !usuarioActual?.id_usuario || cargandoAmistad) return;

    setCargandoAmistad(true);

    if (estadoAmistad === "conectar") {
      try {
        const amistadCreada = await amistadService.crearSolicitud(usuario.id_usuario);
        setIdAmistad(amistadCreada.id_amistad);
        setEstadoAmistad("solicitudEnviada");
      } catch (error) {
        alert("No se pudo enviar la solicitud: " + error.message);
      }

      setCargandoAmistad(false);
      return;
    }

    if (estadoAmistad === "aceptarSolicitud" && idAmistad) {
      try {
        await amistadService.aceptar(idAmistad);
        setEstadoAmistad("amigos");
      } catch (error) {
        alert("No se pudo aceptar la solicitud: " + error.message);
      }

      setCargandoAmistad(false);
      return;
    }

    setCargandoAmistad(false);
  }

  async function cargarCatalogoGeneros() {
    try {
      const datos = await usuariosService.obtenerCatalogoGeneros();
      setCatalogoGeneros(datos || []);
    } catch (error) {
      console.error("Error cargando catálogo de géneros:", error);
      setCatalogoGeneros([]);
    }
  }

  async function cargarEstadisticas() {
    try {
      const datos = await usuariosService.obtenerEstadisticas(usuario.id_usuario);
      setEstadisticas(datos);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  }

  async function cargarGeneros() {
    try {
      const idsGeneros = await usuariosService.obtenerGenerosDe(usuario.id_usuario);
      setGenerosSeleccionadosIds(idsGeneros || []);
    } catch (error) {
      console.error("Error cargando géneros del usuario:", error);
      setGenerosSeleccionadosIds([]);
    }
  }

  async function cargarHighlights() {
    try {
      const datos = await usuariosService.listarHighlights(usuario.id_usuario);
      setHighlightsError("");
      setHighlights(datos || []);
    } catch (error) {
      console.error("Error cargando highlights:", error);
      setHighlights([]);
      setHighlightsError(error.message);
    }
  }

  async function manejarSeleccionarVibra(idVibra) {
    if (!isOwnProfile || idVibra === vibraActual) return;

    const anterior = vibraActual;
    setVibraActual(idVibra);

    try {
      await usuariosService.actualizarVibra(idVibra);
    } catch (error) {
      console.error("Error actualizando vibra de concierto:", error);
      setVibraActual(anterior);
      alert("No se pudo actualizar tu vibra: " + error.message);
    }
  }

  async function manejarSubirHighlight(archivo) {
    if (!isOwnProfile || highlights.length >= 4) return;

    setSubiendoHighlight(true);

    try {
      await usuariosService.subirHighlight(archivo);
      await cargarHighlights();
    } catch (error) {
      alert("No se pudo subir la imagen: " + error.message);
    }

    setSubiendoHighlight(false);
  }

  async function manejarSubirFoto(archivo) {
    if (!isOwnProfile) return;

    setSubiendoFoto(true);

    try {
      const usuarioActualizado = await usuariosService.subirFoto(archivo);
      setFotoLocal(usuarioActualizado.fotoperfil);
      onUsuarioActualizado?.({ ...usuarioBase, fotoperfil: usuarioActualizado.fotoperfil });
    } catch (error) {
      alert("No se pudo subir la foto: " + error.message);
    }

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
