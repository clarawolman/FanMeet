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
    <div className="pantalla-info-grupo">
      <HeaderGrupo
        titulo={`Grupo - ${grupo.nombre}`}
        onVolver={onVolver}
      />

      <HeroGrupo grupo={grupo} concierto={concierto} />

      <ParticipantesGrupo cantidad={grupo.participantes} />

      <StatsGrupo grupo={grupo} />

      <DescripcionGrupo grupo={grupo} />

      <MapaGrupo ubicacion={grupo.ubicacion} />

      <ConfirmacionGrupo grupo={grupo} />
    </div>
  );
}

export default InfoGrupo;