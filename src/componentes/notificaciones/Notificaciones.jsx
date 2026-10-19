import { useContext, useEffect, useState } from "react";
import "./Notificaciones.css";
import CardNotificacion from "./CardNotificacion";
import FiltroSubEvento from "../concierto/FiltroSubEvento";
import { IconoNavNotificaciones } from "../generales/iconosNav";
import Footer from "../generales/Footer";
import HeaderApp from "../generales/HeaderApp";
import { notificacionesService } from "../../services/notificacionesService";
import { amistadService } from "../../services/amistadService";
import { momentosService } from "../../services/momentosService";
import { UsuarioContext } from "../../context/UsuarioContext";
import { mostrarAviso } from "../../utils/avisos";

// Qué tipos entran en cada filtro. "Solicitudes" son las que se responden
// acá mismo (amistad e invitaciones a un momento).
const FILTROS = [
  { id: "todas", nombre: "Todas" },
  { id: "solicitudes", nombre: "Solicitudes" },
  { id: "momentos", nombre: "Momentos" },
  { id: "planes", nombre: "Planes" },
];
const TIPOS_FILTRO = {
  solicitudes: ["solicitud_amistad", "momento_etiquetado"],
  momentos: ["momento_like", "momento_comentario"],
  planes: ["concierto_unido", "novedad_concierto", "grupo_unido", "mensaje_grupo"],
};
const TEXTO_VACIO = {
  todas: "Cuando alguien te mande una solicitud, le dé like a un momento o se sume a tus planes, lo vas a ver acá.",
  solicitudes: "No tenés solicitudes pendientes.",
  momentos: "Todavía nadie reaccionó a tus momentos.",
  planes: "No hay novedades de tus conciertos ni de tus grupos.",
};

const enFiltro = (filtro) => (n) => filtro === "todas" || TIPOS_FILTRO[filtro]?.includes(n.tipo);

// Nuevas (sin leer al abrir la pantalla), y el resto por antigüedad.
function agruparPorFecha(lista, ahora = new Date()) {
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  const haceUnaSemana = inicioHoy - 6 * 24 * 60 * 60 * 1000;
  const grupos = [
    { id: "nuevas", titulo: "Nuevas", items: [] },
    { id: "hoy", titulo: "Hoy", items: [] },
    { id: "semana", titulo: "Esta semana", items: [] },
    { id: "antes", titulo: "Antes", items: [] },
  ];
  for (const n of lista) {
    const fecha = new Date(n.created_at).getTime();
    if (!n.leida) grupos[0].items.push(n);
    else if (fecha >= inicioHoy) grupos[1].items.push(n);
    else if (fecha >= haceUnaSemana) grupos[2].items.push(n);
    else grupos[3].items.push(n);
  }
  return grupos.filter((g) => g.items.length > 0);
}

function Notificaciones({ onVolver, onNavegar, onVerMas }) {
  const { usuarioActual } = useContext(UsuarioContext);
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);
  const [filtro, setFiltro] = useState("todas");

  useEffect(() => {
    if (usuarioActual?.id_usuario) {
      cargarNotificaciones();
    }
  }, [usuarioActual]);

  async function cargarNotificaciones() {
    setCargando(true);

    try {
      // El backend ya marca como leídas las notificaciones no leídas al
      // listarlas (notificacionService.listar), mismo comportamiento que
      // tenía este componente al llamar marcarComoLeidas() después de cargar.
      const data = await notificacionesService.listar();
      setNotificaciones(data || []);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
      setNotificaciones([]);
    }

    setCargando(false);
  }

  async function manejarEliminar(notificacion) {
    const notificacionesAnteriores = notificaciones;

    setNotificaciones((actuales) =>
      actuales.filter(
        (n) => n.id_notificacion !== notificacion.id_notificacion
      )
    );

    try {
      await notificacionesService.eliminar(notificacion.id_notificacion);
    } catch (error) {
      console.error("Error eliminando notificación:", error);
      setNotificaciones(notificacionesAnteriores);
      mostrarAviso("No se pudo eliminar la notificación. Probá de nuevo.");
    }
  }

  // Invitación a un momento: aceptar lo suma a mis momentos, rechazar no.
  async function responderMomento(notificacion, aceptar) {
    if (!notificacion.id_highlight || procesandoId) return;

    setProcesandoId(notificacion.id_notificacion);

    try {
      if (aceptar) await momentosService.aceptarInvitacion(notificacion.id_highlight);
      else await momentosService.quitarDeMiPerfil(notificacion.id_highlight);
    } catch (error) {
      setProcesandoId(null);
      // Ya no existe (lo borraron todos): la invitación no sirve más.
      if (error.status === 404) {
        mostrarAviso("Ese momento ya no está disponible.", "info");
        await manejarEliminar(notificacion);
      } else {
        mostrarAviso(`No se pudo ${aceptar ? "aceptar" : "rechazar"} el momento: ${error.message}`);
      }
      return;
    }

    setProcesandoId(null);
    if (aceptar) mostrarAviso("Listo, ya está en tus momentos.", "exito");
    setNotificaciones((actuales) =>
      actuales.filter((n) => n.id_notificacion !== notificacion.id_notificacion)
    );
  }

  async function manejarAceptarSolicitud(notificacion) {
    if (notificacion.tipo === "momento_etiquetado") return responderMomento(notificacion, true);
    if (!notificacion.id_amistad || procesandoId) return;

    setProcesandoId(notificacion.id_notificacion);

    try {
      await amistadService.aceptar(notificacion.id_amistad);
    } catch (error) {
      setProcesandoId(null);
      console.error("Error aceptando solicitud de amistad:", error);
      mostrarAviso("No se pudo aceptar la solicitud: " + error.message);
      return;
    }

    setProcesandoId(null);
    setNotificaciones((actuales) =>
      actuales.filter(
        (n) => n.id_notificacion !== notificacion.id_notificacion
      )
    );
  }

  async function manejarRechazarSolicitud(notificacion) {
    if (notificacion.tipo === "momento_etiquetado") return responderMomento(notificacion, false);
    if (!notificacion.id_amistad || procesandoId) return;

    setProcesandoId(notificacion.id_notificacion);

    try {
      await amistadService.rechazar(notificacion.id_amistad);
    } catch (error) {
      setProcesandoId(null);
      console.error("Error rechazando solicitud de amistad:", error);
      mostrarAviso("No se pudo rechazar la solicitud: " + error.message);
      return;
    }

    setProcesandoId(null);
    setNotificaciones((actuales) =>
      actuales.filter(
        (n) => n.id_notificacion !== notificacion.id_notificacion
      )
    );
  }

  const cantidades = Object.fromEntries(
    FILTROS.map((f) => [f.id, notificaciones.filter(enFiltro(f.id)).length])
  );
  const nuevas = notificaciones.filter((n) => !n.leida).length;
  const pendientes = cantidades.solicitudes;
  const grupos = agruparPorFecha(notificaciones.filter(enFiltro(filtro)));

  const resumen = [
    nuevas > 0 && `${nuevas} ${nuevas === 1 ? "nueva" : "nuevas"}`,
    pendientes > 0 && `${pendientes} ${pendientes === 1 ? "solicitud pendiente" : "solicitudes pendientes"}`,
  ].filter(Boolean);

  return (
    <div className="pantallaNotificaciones">
      <HeaderApp onVolver={onVolver} titulo="Notificaciones" />

      <main className="notificacionesContenido">
        <header className="notificacionesIntro">
          <h2>Actividad</h2>
          <p>
            {cargando
              ? "Buscando novedades…"
              : resumen.length > 0
                ? resumen.join(" · ")
                : "Estás al día."}
          </p>
        </header>

        {!cargando && notificaciones.length > 0 && (
          <FiltroSubEvento
            filtros={FILTROS}
            filtroActivo={filtro}
            onCambiarFiltro={setFiltro}
            cantidades={pendientes > 0 ? { solicitudes: pendientes } : {}}
            etiqueta="Filtrar notificaciones"
          />
        )}

        {cargando && (
          <div className="notificacionesGrupo" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div className="notificacionEsqueleto" key={i}>
                <span className="fmSkeleton notificacionEsqueletoFoto" />
                <span className="notificacionEsqueletoTexto">
                  <span className="fmSkeleton" />
                  <span className="fmSkeleton" />
                </span>
              </div>
            ))}
          </div>
        )}

        {!cargando && grupos.length === 0 && (
          <div className="notificacionesVacio">
            <span className="notificacionesVacioIcono" aria-hidden="true">
              <IconoNavNotificaciones />
            </span>
            <h3>{filtro === "todas" ? "Todo tranquilo por acá" : "Nada por ahora"}</h3>
            <p>{TEXTO_VACIO[filtro]}</p>
            {filtro === "todas" && (
              <button type="button" className="fmBotonPrimario" onClick={() => onNavegar?.("descubrir")}>
                Descubrir fans
              </button>
            )}
          </div>
        )}

        {!cargando &&
          grupos.map((grupo) => (
            <section className="notificacionesSeccion" key={grupo.id} aria-labelledby={`notif-${grupo.id}`}>
              <h3 className="notificacionesSeccionTitulo" id={`notif-${grupo.id}`}>
                {grupo.titulo}
                {grupo.id === "nuevas" && <span className="notificacionesSeccionCantidad">{grupo.items.length}</span>}
              </h3>
              <div className="notificacionesGrupo">
                {grupo.items.map((notificacion) => (
                  <CardNotificacion
                    key={notificacion.id_notificacion}
                    notificacion={notificacion}
                    onVerMas={onVerMas}
                    onEliminar={manejarEliminar}
                    onAceptarSolicitud={manejarAceptarSolicitud}
                    onRechazarSolicitud={manejarRechazarSolicitud}
                    procesando={procesandoId === notificacion.id_notificacion}
                  />
                ))}
              </div>
            </section>
          ))}
      </main>

      <Footer onNavegar={onNavegar} pantallaActiva="notificaciones" />
    </div>
  );
}

export default Notificaciones;
