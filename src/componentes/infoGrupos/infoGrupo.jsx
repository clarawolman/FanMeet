import { useEffect, useState } from "react";
import "./infoGrupo.css";
import { supabase } from "../../supabase";
import { crearNotificacion } from "../../notificaciones";

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
  const [verificandoConfirmacion, setVerificandoConfirmacion] = useState(true);

  useEffect(() => {
    if (usuarioActual && grupo) {
      verificarConfirmacion();
    }
  }, [usuarioActual, grupo]);

  async function verificarConfirmacion() {
    setVerificandoConfirmacion(true);

    const { data, error } = await supabase
      .from("grupos_usuarios")
      .select("*")
      .eq("id_usuario", usuarioActual.id_usuario)
      .eq("id_grupo", grupo.id_grupo)
      .maybeSingle();

    if (error) {
      console.error("Error verificando asistencia:", error);
      setConfirmado(false);
      setVerificandoConfirmacion(false);
      return;
    }

    setConfirmado(!!data);
    setVerificandoConfirmacion(false);
  }

  async function confirmarAsistenciaGrupo() {
    if (!usuarioActual || !grupo || confirmado) return;

    setCargandoConfirmacion(true);

    const { error } = await supabase.from("grupos_usuarios").insert([
      {
        id_usuario: usuarioActual.id_usuario,
        id_grupo: grupo.id_grupo,
      },
    ]);

    if (error) {
      console.error("Error al sumarse al grupo:", error);
      alert("No se pudo confirmar la asistencia: " + error.message);
      setCargandoConfirmacion(false);
      return;
    }

    await crearNotificacion({
      idUsuario: usuarioActual.id_usuario,
      tipo: "grupo_unido",
      titulo: `Te uniste al grupo ${grupo.nombre}`,
      descripcion: concierto?.nombre || concierto?.artista?.nombre || "",
      imagen: grupo.foto || grupo.imagen || grupo.imagenGrupo || "",
      idGrupo: grupo.id_grupo,
    });

    setConfirmado(true);
    setCargandoConfirmacion(false);
  }

  return (
    <div className="infoGrupo">
      <HeaderGrupo titulo={`Grupo - ${grupo.nombre}`} onVolver={onVolver} />

      <div className="infoGrupoContenido">
        <HeroGrupo grupo={grupo} concierto={concierto} />

        <ParticipantesGrupo participantes={grupo.usuarios} />

        <StatsGrupo grupo={grupo} />

        <DescripcionGrupo descripcion={grupo.descripcion} />

        <MapaGrupo ubicacion={grupo.ubicacion} />

        {!verificandoConfirmacion && !confirmado && (
          <ConfirmacionGrupo
            onConfirmar={confirmarAsistenciaGrupo}
            cargandoConfirmacion={cargandoConfirmacion}
          />
        )}
      </div>

      <Footer onNavegar={onNavegar} />
    </div>
  );
}

export default InfoGrupo;