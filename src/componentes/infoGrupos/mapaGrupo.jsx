import "./mapaGrupo.css";
import { IconoUbicacion } from "../generales/iconosTarjeta";

export default function MapaGrupo({ ubicacion }) {
  if (!ubicacion?.trim()) return null;

  const consulta = encodeURIComponent(ubicacion);
  const mapaUrl = `https://maps.google.com/maps?q=${consulta}&z=15&output=embed`;
  const abrirUrl = `https://www.google.com/maps/search/?api=1&query=${consulta}`;

  return (
    <div className="mapaGrupo">
      <div className="mapaGrupoHeader">
        <div>
          <h3>Mapa</h3>
          <p>{ubicacion}</p>
        </div>
        <a className="mapaGrupoAbrir" href={abrirUrl} target="_blank" rel="noreferrer">
          <IconoUbicacion width="14" height="14" />
          Cómo llegar
        </a>
      </div>

      <div className="mapaFake">
        <iframe src={mapaUrl} width="100%" height="240" loading="lazy" allowFullScreen title={`Mapa de ${ubicacion}`} />
      </div>
    </div>
  );
}
