import { useEffect, useState } from "react";
import "./infoGrupo.css";
import { supabase } from "../../supabase";
import HeaderGrupo from "./headerGrupo";
import HeroGrupo from "./heroGrupo";
import StatsGrupo from "./statsGrupo";
import DescripcionGrupo from "./descripcionGrupo";
import MapaGrupo from "./mapaGrupo";
import ConfirmacionGrupo from "./confirmacionGrupo";
import ParticipantesGrupo from "./participantesGrupo";
import Footer from "../generales/Footer";

function InfoGrupo({ grupo, concierto, onVolver, usuarioActual, onNavegar }) {
  const [confirmado, setConfirmado] = useState(false);
  const [cargandoConfirmacion, setCargandoConfirmacion] = useState(false);
  useEffect(() => {
    if (usuarioActual && grupo) {
      verificarConfirmacion();
    }
  }, [usuarioActual, grupo]);

  async function verificarConfirmacion() {
    const { data, error } = await supabase
      .from("grupos_usuarios")
      .select("*")
      .eq("id_usuario", usuarioActual.id_usuario)
      .eq("id_grupo", grupo.id_grupo)
      .maybeSingle();

    if (error) {
      console.error("Error verificando asistencia:", error);
      return;
    }

    setConfirmado(!!data);
  }  
  const confirmarAsistenciaGrupo = async () => {
  if (!usuarioActual || !grupo || confirmado) return;

  setCargandoConfirmacion(true);

  const { error } = await supabase.from("grupos_usuarios").insert([
    {
      id_usuario: usuarioActual.id_usuario,
      id_grupo: grupo.id_grupo,
    },
  ]);

  /*if (error) {
    console.error("Error al sumarse al grupo:", error);
    setCargandoConfirmacion(false);
    alert("No se pudo confirmar la asistencia");
    return;
  }*/
 console.error("Error al sumarse al grupo:", error);
console.log("MENSAJE:", error.message);
console.log("CODE:", error.code);
console.log("DETAILS:", error.details);

alert("No se pudo confirmar la asistencia: " + error.message);
return;

  setConfirmado(true);
  setCargandoConfirmacion(false);
};

  return (
    <div className="infoGrupo">
      <HeaderGrupo titulo={`Grupo - ${grupo.nombre}`} onVolver={onVolver} />

      <div className="infoGrupoContenido">
        <HeroGrupo grupo={grupo} concierto={concierto} />
        <ParticipantesGrupo participantes={grupo.usuarios} />
        <StatsGrupo grupo={grupo} />
        <DescripcionGrupo descripcion={grupo.descripcion} />
        <MapaGrupo ubicacion={grupo.ubicacion} />
        <ConfirmacionGrupo
          onConfirmar={confirmarAsistenciaGrupo}
          confirmado={confirmado}
          cargandoConfirmacion={cargandoConfirmacion}
        />
      </div>
    <Footer onNavegar={onNavegar} />
    </div>
  );
}

export default InfoGrupo;