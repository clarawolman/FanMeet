import "./infoGrupo.css";

import HeaderGrupo from "./headerGrupo";
import HeroGrupo from "./heroGrupo";
import StatsGrupo from "./statsGrupo";
import DescripcionGrupo from "./descripcionGrupo";
import MapaGrupo from "./mapaGrupo";
import ConfirmacionGrupo from "./confirmacionGrupo";
import ParticipantesGrupo from "./participantesGrupo";
import Footer from "../concierto/Footer";

function InfoGrupo({ grupo, concierto, onVolver }) {
  return (
    <div className="infoGrupo">
      <HeaderGrupo titulo={`Grupo - ${grupo.nombre}`} onVolver={onVolver} />

      <div className="infoGrupoContenido">
        <HeroGrupo grupo={grupo} concierto={concierto} />
        <ParticipantesGrupo participantes={grupo.usuarios} />
        <StatsGrupo grupo={grupo} />
        <DescripcionGrupo descripcion={grupo.descripcion} />
        <MapaGrupo ubicacion={grupo.ubicacion} />
        <ConfirmacionGrupo />
      </div>

      <Footer />
    </div>
  );
}

export default InfoGrupo;