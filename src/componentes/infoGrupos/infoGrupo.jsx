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
import ModalConfirmacion from "../generales/ModalConfirmacion";

function InfoGrupo({ grupo, concierto, onVolver, usuarioActual, onNavegar }) {
  const [confirmado, setConfirmado] = useState(false);
  const [cargandoConfirmacion, setCargandoConfirmacion] = useState(false);
  const [verificandoConfirmacion, setVerificandoConfirmacion] = useState(true);
  const [mostrarConfirmarSalida, setMostrarConfirmarSalida] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

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

    setConfirmado(true);
    setCargandoConfirmacion(false);
  }

  async function confirmarSalirDelGrupo() {
    setSaliendo(true);

    const { error } = await supabase
      .from("grupos_usuarios")
      .delete()
      .eq("id_usuario", usuarioActual.id_usuario)
      .eq("id_grupo", grupo.id_grupo);

    setSaliendo(false);

    if (error) {
      console.error("Error al salir del grupo:", error);
      alert("No se pudo salir del grupo: " + error.message);
      return;
    }

    setMostrarConfirmarSalida(false);
    setConfirmado(false);
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

        {!verificandoConfirmacion && confirmado && (
          <button
            className="botonSalirGrupo"
            type="button"
            onClick={() => setMostrarConfirmarSalida(true)}
          >
            Salir del grupo
          </button>
        )}
      </div>

      {mostrarConfirmarSalida && (
        <ModalConfirmacion
          mensaje={`¿Salir de ${grupo.nombre}?`}
          textoConfirmar="Salir del grupo"
          textoCancelar="Cancelar"
          confirmando={saliendo}
          onConfirmar={confirmarSalirDelGrupo}
          onCancelar={() => setMostrarConfirmarSalida(false)}
        />
      )}

      <Footer onNavegar={onNavegar} />
    </div>
  );
}

export default InfoGrupo;