import { useState } from "react";
import "./BotonConectar.css";
import { amistadService } from "../../services/amistadService";

const TEXTOS = {
  conectar: "Conectar",
  solicitudEnviada: "Solicitud enviada",
  aceptarSolicitud: "Aceptar solicitud",
  amigos: "Amigos ✓",
};

// Botón de amistad para las cards de fans compatibles. Arranca con el
// estado que manda el backend (estadoAmistad / idAmistad) y lo actualiza
// solo, sin recargar la lista.
export default function BotonConectar({ fan, className = "" }) {
  const [estado, setEstado] = useState(fan.estadoAmistad || "conectar");
  const [idAmistad, setIdAmistad] = useState(fan.idAmistad ?? null);
  const [procesando, setProcesando] = useState(false);

  async function manejarClick(e) {
    e.stopPropagation();
    setProcesando(true);
    try {
      if (estado === "conectar") {
        const amistad = await amistadService.crearSolicitud(fan.id_usuario);
        setIdAmistad(amistad?.id_amistad ?? null);
        setEstado("solicitudEnviada");
      } else if (estado === "aceptarSolicitud") {
        await amistadService.aceptar(idAmistad);
        setEstado("amigos");
      }
    } catch (error) {
      alert("No se pudo completar la acción: " + error.message);
    }
    setProcesando(false);
  }

  const accionable = estado === "conectar" || (estado === "aceptarSolicitud" && idAmistad);

  return (
    <button
      type="button"
      className={`botonConectar botonConectar--${estado} ${className}`}
      disabled={!accionable || procesando}
      onClick={manejarClick}
    >
      {procesando ? "..." : TEXTOS[estado] || TEXTOS.conectar}
    </button>
  );
}
