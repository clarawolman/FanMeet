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
import ModalConfirmacion from "../generales/ModalConfirmacion";

function InfoGrupo({
  grupo,
  concierto,
  onVolver,
  usuarioActual,
  onNavegar,
  onGrupoEliminado,
}) {
  const [confirmado, setConfirmado] = useState(false);
  const [cargandoConfirmacion, setCargandoConfirmacion] = useState(false);
  const [verificandoConfirmacion, setVerificandoConfirmacion] = useState(true);
  const [mostrarConfirmarSalida, setMostrarConfirmarSalida] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [mostrarConfirmarEliminar, setMostrarConfirmarEliminar] =
    useState(false);
  const [eliminando, setEliminando] = useState(false);

  const esCreador = usuarioActual?.id_usuario === grupo.id_creador;

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

  async function confirmarEliminarGrupo() {
    setEliminando(true);

    const { error: errorParticipantes } = await supabase
      .from("grupos_usuarios")
      .delete()
      .eq("id_grupo", grupo.id_grupo);

    if (errorParticipantes) {
      console.error("Error al eliminar participantes del grupo:", errorParticipantes);
      alert("No se pudo eliminar el grupo: " + errorParticipantes.message);
      setEliminando(false);
      return;
    }

    const { error: errorGrupo } = await supabase
      .from("grupo")
      .delete()
      .eq("id_grupo", grupo.id_grupo);

    setEliminando(false);

    if (errorGrupo) {
      console.error("Error al eliminar el grupo:", errorGrupo);
      alert("No se pudo eliminar el grupo: " + errorGrupo.message);
      return;
    }

    setMostrarConfirmarEliminar(false);

    if (onGrupoEliminado) {
      await onGrupoEliminado();
    } else {
      onVolver();
    }
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

        {!verificandoConfirmacion && confirmado && esCreador && (
          <button
            className="botonEliminarGrupo"
            type="button"
            onClick={() => setMostrarConfirmarEliminar(true)}
          >
            Eliminar grupo
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

      {mostrarConfirmarEliminar && (
        <ModalConfirmacion
          mensaje={`¿Eliminar ${grupo.nombre}? Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar grupo"
          textoCancelar="Cancelar"
          confirmando={eliminando}
          onConfirmar={confirmarEliminarGrupo}
          onCancelar={() => setMostrarConfirmarEliminar(false)}
        />
      )}

      <Footer onNavegar={onNavegar} />
    </div>
  );
}

export default InfoGrupo;