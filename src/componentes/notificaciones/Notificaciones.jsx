import { useEffect, useState } from "react";
import "./Notificaciones.css";
import CardNotificacion from "./CardNotificacion";
import Footer from "../generales/Footer";
import { notificacionesService } from "../../services/notificacionesService";
import { amistadService } from "../../services/amistadService";

function Notificaciones({ usuarioActual, onVolver, onNavegar, onVerMas }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);

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
      alert("No se pudo eliminar la notificación. Probá de nuevo.");
    }
  }

  async function manejarAceptarSolicitud(notificacion) {
    if (!notificacion.id_amistad || procesandoId) return;

    setProcesandoId(notificacion.id_notificacion);

    try {
      await amistadService.aceptar(notificacion.id_amistad);
    } catch (error) {
      setProcesandoId(null);
      console.error("Error aceptando solicitud de amistad:", error);
      alert("No se pudo aceptar la solicitud: " + error.message);
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
    if (!notificacion.id_amistad || procesandoId) return;

    setProcesandoId(notificacion.id_notificacion);

    try {
      await amistadService.rechazar(notificacion.id_amistad);
    } catch (error) {
      setProcesandoId(null);
      console.error("Error rechazando solicitud de amistad:", error);
      alert("No se pudo rechazar la solicitud: " + error.message);
      return;
    }

    setProcesandoId(null);
    setNotificaciones((actuales) =>
      actuales.filter(
        (n) => n.id_notificacion !== notificacion.id_notificacion
      )
    );
  }

  return (
    <div className="pantallaNotificaciones">
      <header className="home-header">
        <div className="home-header-icons">
          <p className="home-eyebrow">FanMeet</p>
        </div>
      </header>

      <section className="barraTituloNotificaciones">
        <button
          type="button"
          className="btnVolverNotificaciones"
          onClick={onVolver}
          aria-label="Volver"
        >
          ←
        </button>
        <h2>Notificaciones</h2>
      </section>

      <main className="notificacionesLista">
        {cargando && (
          <p className="mensajeNotificaciones">Cargando notificaciones...</p>
        )}

        {!cargando && notificaciones.length === 0 && (
          <p className="mensajeNotificaciones">
            Todavía no tenés notificaciones.
          </p>
        )}

        {!cargando &&
          notificaciones.map((notificacion) => (
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
      </main>

      <Footer onNavegar={onNavegar} pantallaActiva="notificaciones" />
    </div>
  );
}

export default Notificaciones;
