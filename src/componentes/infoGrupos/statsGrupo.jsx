import "./statsGrupo.css";
import TiraTicket from "../generales/TiraTicket";
import { formatearFechaLarga } from "../../utils/fechas";

// Fecha, hora y lugar del grupo como el talón de una entrada (se monta
// sobre el borde de la foto, igual que en el concierto).
export default function StatsGrupo({ grupo }) {
  const hora = grupo.hora?.slice(0, 5);
  return (
    <TiraTicket
      className="statsGrupo"
      datos={[
        { etiqueta: "Fecha", valor: formatearFechaLarga(grupo.fecha), detalle: String(grupo.fecha || "").slice(0, 4) },
        { etiqueta: "Hora", valor: hora && `${hora} h` },
        { etiqueta: "Punto de encuentro", valor: grupo.ubicacion },
      ]}
    />
  );
}
