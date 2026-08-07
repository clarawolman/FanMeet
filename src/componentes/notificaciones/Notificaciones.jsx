import { useEffect, useState } from "react";
import "./Notificaciones.css";
import CardNotificacion from "./CardNotificacion";
import Footer from "../generales/Footer";
import { supabase } from "../../supabase";

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

    const { data, error } = await supabase
      .from("notificacion")
      .select("*")
      .eq("id_usuario", usuarioActual.id_usuario)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando notificaciones:", error);
      setNotificaciones([]);
      setCargando(false);
      return;
    }

    setNotificaciones(data || []);
    setCargando(false);

    marcarComoLeidas(data || []);
  }

  async function marcarComoLeidas(lista) {
    const idsSinLeer = lista
      .filter((n) => !n.leida)
      .map((n) => n.id_notificacion);

    if (idsSinLeer.length === 0) return;

    const { error } = await supabase
      .from("notificacion")
      .update({ leida: true })
      .in("id_notificacion", idsSinLeer);

    if (error) {
      console.error("Error marcando notificaciones como leídas:", error);
    }
  }

  async function manejarEliminar(notificacion) {
    const notificacionesAnteriores = notificaciones;

    setNotificaciones((actuales) =>
      actuales.filter(
        (n) => n.id_notificacion !== notificacion.id_notificacion
      )
    );

    const { error } = await supabase
      .from("notificacion")
      .delete()
      .eq("id_notificacion", notificacion.id_notificacion);

    if (error) {
      console.error("Error eliminando notificación:", error);
      setNotificaciones(notificacionesAnteriores);
      alert("No se pudo eliminar la notificación. Probá de nuevo.");
    }
  }

  async function manejarAceptarSolicitud(notificacion) {
    if (!notificacion.id_amistad || procesandoId) return;

    setProcesandoId(notificacion.id_notificacion);

    const { error } = await supabase
      .from("amistad")
      .update({ estado: "aceptada" })
      .eq("id_amistad", notificacion.id_amistad);

    setProcesandoId(null);

    if (error) {
      console.error("Error aceptando solicitud de amistad:", error);
      alert("No se pudo aceptar la solicitud: " + error.message);
      return;
    }

    setNotificaciones((actuales) =>
      actuales.filter(
        (n) => n.id_notificacion !== notificacion.id_notificacion
      )
    );
  }

  async function manejarRechazarSolicitud(notificacion) {
    if (!notificacion.id_amistad || procesandoId) return;

    setProcesandoId(notificacion.id_notificacion);

    const { error } = await supabase
      .from("amistad")
      .delete()
      .eq("id_amistad", notificacion.id_amistad);

    setProcesandoId(null);

    if (error) {
      console.error("Error rechazando solicitud de amistad:", error);
      alert("No se pudo rechazar la solicitud: " + error.message);
      return;
    }

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
