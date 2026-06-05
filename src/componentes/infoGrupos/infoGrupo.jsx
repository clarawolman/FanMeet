import "./infoGrupo.css";
import { supabase } from "../../supabase";

import HeaderGrupo from "./headerGrupo";
import HeroGrupo from "./heroGrupo";
import StatsGrupo from "./statsGrupo";
import DescripcionGrupo from "./descripcionGrupo";
import MapaGrupo from "./mapaGrupo";
import ConfirmacionGrupo from "./confirmacionGrupo";
import ParticipantesGrupo from "./participantesGrupo";

function InfoGrupo({ grupo, concierto, onVolver, usuario }) {
  const confirmarAsistenciaGrupo = async () => {
  if (!usuario || !grupo) return;

  const { data, error } = await supabase
    .from("grupos_usuarios")
    .insert({
      id: Date.now(),
      id_usuario: usuario.id_usuario,
      id_grupo: grupo.id_grupo,
    })
    .select();

  if (error) {
    console.error("Error al sumarse al grupo:", error);
    alert(error.message);
    return;
  }

  alert("Te sumaste al grupo");
};

  return (
    <div className="infoGrupo">
      <HeaderGrupo titulo={`Grupo - ${grupo.nombre}`} onVolver={onVolver} />

      <HeroGrupo grupo={grupo} concierto={concierto} />

      <ParticipantesGrupo participantes={grupo.usuarios} />

      <StatsGrupo grupo={grupo} />

      <DescripcionGrupo descripcion={grupo.descripcion} />

      <MapaGrupo ubicacion={grupo.ubicacion} />

      <ConfirmacionGrupo onConfirmar={confirmarAsistenciaGrupo} />
    </div>
  );
}

export default InfoGrupo;