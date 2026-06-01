import "./infoGrupo.css";

import HeaderGrupo from "./headerGrupo";
import HeroGrupo from "./heroGrupo";
import StatsGrupo from "./statsGrupo";
import DescripcionGrupo from "./descripcionGrupo";
import MapaGrupo from "./mapaGrupo";
import ConfirmacionGrupo from "./confirmacionGrupo";
import ParticipantesGrupo from "./participantesGrupo";

function InfoGrupo({ grupo, concierto, onVolver }) {
  return (
    <div className="infoGrupo">
      <HeaderGrupo titulo={`Grupo - ${grupo.nombre}`} onVolver={onVolver} />

      <HeroGrupo grupo={grupo} concierto={concierto} />

      <ParticipantesGrupo participantes={grupo.usuarios} />

      <StatsGrupo grupo={grupo} />

      <DescripcionGrupo descripcion={grupo.descripcion} />

      <MapaGrupo ubicacion={grupo.ubicacion} />

      <ConfirmacionGrupo />
    </div>
  );
}

export default InfoGrupo;