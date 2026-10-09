import { useContext, useEffect, useState } from "react";
import "./perfil.css";
import { usuariosService } from "../../services/usuariosService";
import { amistadService } from "../../services/amistadService";
import { conciertosService } from "../../services/conciertosService";
import Footer from "../generales/Footer";
import HeaderPerfil from "./headerPerfil";
import StatsPerfil from "./statsPerfil";
import GenerosPerfil from "./generosPerfil";
import VibraConcierto from "./vibraConcierto";
import ProximosConciertosPerfil from "./proximosConciertosPerfil";
import HighlightsPerfil from "./highlightsPerfil";
import EditarGeneros from "../editarGeneros/EditarGeneros";
import ListaAmigosPerfil from "./listaAmigosPerfil";
import ArtistasFavoritosPerfil from "./artistasFavoritosPerfil";
import EscuchasPerfil from "./escuchasPerfil";
import CompatibilidadPerfil from "./compatibilidadPerfil";
import ResumenLastfmPerfil from "./resumenLastfmPerfil";
import LoadingSpinner from "../generales/LoadingSpinner";
import { idDeGenero, nombreDeGenero } from "../../utils/generos";
import { IconoPogo, IconoSentado, IconoPrimeraFila } from "./vibraIconos";
import { UsuarioContext } from "../../context/UsuarioContext";

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
  usuarioPerfil,
  isOwnProfile: esPerfilPropio = true,
  onNavegar,
  onVolver,
  onCerrarSesion,
  onVerUsuario,
  onEnviarMensaje,
  onIngresarConcierto,
}) {
  const { usuarioActual, setUsuarioActual } = useContext(UsuarioContext);
  const usuarioBase = usuarioPerfil || usuarioActual;
  // Si el perfil es el tuyo, se trata como propio aunque se haya abierto
  // como "ajeno": nunca se puede conectar con uno mismo.
  const isOwnProfile =
    esPerfilPropio ||
    (Boolean(usuarioPerfil?.id_usuario) && usuarioPerfil.id_usuario === usuarioActual?.id_usuario);

  // La foto se actualiza optimistamente acá y también se guarda en el
  // UsuarioContext para que el resto de la app la vea.
  const [fotoLocal, setFotoLocal] = useState(null);
  const usuario = fotoLocal
    ? { ...usuarioBase, fotoperfil: fotoLocal }
    : usuarioBase;

  const [mostrarEditorGeneros, setMostrarEditorGeneros] = useState(false);
  const [mostrarAmigos, setMostrarAmigos] = useState(false);
  // Sube cuando cambia la música del perfil desde Last.fm (vincular o sumar
  // sugerencias): remonta el resumen y los favoritos para que se recarguen.
  const [versionMusica, setVersionMusica] = useState(0);

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
  const [proximosEventos, setProximosEventos] = useState([]);
  const [cargandoEventos, setCargandoEventos] = useState(isOwnProfile);

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
      cargarProximosEventos(),
    ]);

    setCargando(false);
  }

  async function cargarProximosEventos() {
    // Solo existe endpoint para "mis eventos" del usuario autenticado, así
    // que en un perfil ajeno no hay de dónde traer esta lista.
    if (!isOwnProfile) return;

    setCargandoEventos(true);

    try {
      const eventos = await conciertosService.listarMisEventos();
      setProximosEventos(eventos || []);
    } catch (error) {
      console.error("Error cargando próximos conciertos:", error);
      setProximosEventos([]);
    }

    setCargandoEventos(false);
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

  // Al editar géneros o sumar sugerencias de Last.fm se pueden haber creado
  // géneros nuevos: sin recargar el catálogo se verían como "Género #id".
  function recargarGeneros() {
    return Promise.all([cargarGeneros(), cargarCatalogoGeneros()]);
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
      alert("No se pudo actualizar la vibe: " + error.message);
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
      setUsuarioActual({ ...usuarioBase, fotoperfil: usuarioActualizado.fotoperfil });
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
        onEnviarMensaje={
          !isOwnProfile && onEnviarMensaje ? () => onEnviarMensaje(usuario.id_usuario) : undefined
        }
      />

      <div className="perfilContenido">
        <ResumenLastfmPerfil
          key={`resumen-${usuario.id_usuario}-${versionMusica}`}
          idUsuario={usuario.id_usuario}
        />

        {!isOwnProfile && (
          <CompatibilidadPerfil
            key={`compatibilidad-${usuario.id_usuario}`}
            idUsuario={usuario.id_usuario}
            nombre={usuario.nombre}
          />
        )}

        <StatsPerfil
          estadisticas={estadisticas}
          onVerConciertos={isOwnProfile ? () => onNavegar?.("misEventos") : undefined}
          onVerAmigos={() => setMostrarAmigos(true)}
          onVerGrupos={isOwnProfile ? () => onNavegar?.("misGrupos") : undefined}
        />

        <GenerosPerfil
          generos={generosConNombre}
          isOwnProfile={isOwnProfile}
          onEditar={() => setMostrarEditorGeneros(true)}
        />

        {/* Keys distintas entre hermanos: con la misma key React duplica u
            omite secciones. Cambian con el usuario para reiniciar su estado. */}
        <ArtistasFavoritosPerfil
          key={`favoritos-${usuario.id_usuario}-${versionMusica}`}
          idUsuario={usuario.id_usuario}
          isOwnProfile={isOwnProfile}
        />

        <EscuchasPerfil
          key={`escuchas-${usuario.id_usuario}`}
          idUsuario={usuario.id_usuario}
          isOwnProfile={isOwnProfile}
          onPerfilMusicalActualizado={() => {
            setVersionMusica((v) => v + 1);
            recargarGeneros();
          }}
        />

        <VibraConcierto
          vibras={AMBIENTES_CONCIERTO}
          vibraActual={vibraActual}
          isOwnProfile={isOwnProfile}
          onSeleccionar={manejarSeleccionarVibra}
        />

        {isOwnProfile && (
          <ProximosConciertosPerfil
            eventos={proximosEventos}
            cargando={cargandoEventos}
            onVerConcierto={(evento) => onIngresarConcierto?.(evento.id_concierto)}
            onVerTodos={() => onNavegar?.("misEventos")}
            onDescubrir={() => onNavegar?.("home")}
          />
        )}

        <HighlightsPerfil
          highlights={highlights}
          isOwnProfile={isOwnProfile}
          subiendo={subiendoHighlight}
          error={highlightsError}
          onSubirHighlight={manejarSubirHighlight}
        />

        {cargando && <LoadingSpinner texto="Cargando perfil..." />}
      </div>

      <Footer
        onNavegar={onNavegar}
        pantallaActiva={isOwnProfile ? "perfil" : "perfilAjeno"}
      />

      {mostrarEditorGeneros && (
        <div className="perfilOverlayPantalla">
          <EditarGeneros
            onVolver={() => {
              setMostrarEditorGeneros(false);
              recargarGeneros();
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
