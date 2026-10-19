import { useContext, useEffect, useState } from "react";
import "./infoGrupo.css";
import { gruposService } from "../../services/gruposService";

import HeaderGrupo from "./headerGrupo";
import HeroGrupo from "./heroGrupo";
import StatsGrupo from "./statsGrupo";
import DescripcionGrupo from "./descripcionGrupo";
import MapaGrupo from "./mapaGrupo";
import ConfirmacionGrupo from "./confirmacionGrupo";
import ParticipantesGrupo from "./participantesGrupo";
import Footer from "../generales/Footer";
import ModalConfirmacion from "../generales/ModalConfirmacion";
import ModalConsejosSeguridad from "./ModalConsejosSeguridad";
import { consejosOcultos } from "../../utils/consejosSeguridad";
import { UsuarioContext } from "../../context/UsuarioContext";
import { mostrarAviso } from "../../utils/avisos";

function InfoGrupo({
  grupo,
  concierto,
  onVolver,
  onNavegar,
  onGrupoEliminado,
  onVerFansConfirmados,
  onAbrirChat,
  onEditar,
}) {
  const { usuarioActual } = useContext(UsuarioContext);
  const [confirmado, setConfirmado] = useState(false);
  const [cargandoConfirmacion, setCargandoConfirmacion] = useState(false);
  const [verificandoConfirmacion, setVerificandoConfirmacion] = useState(true);
  const [mostrarConfirmarSalida, setMostrarConfirmarSalida] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [mostrarConfirmarEliminar, setMostrarConfirmarEliminar] =
    useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [mostrarConsejos, setMostrarConsejos] = useState(false);

  const esCreador = usuarioActual?.id_usuario === grupo.id_creador;
  const completo = Boolean(grupo.cupo) && (grupo.usuarios || []).length >= grupo.cupo;

  useEffect(() => {
    if (usuarioActual && grupo) {
      verificarConfirmacion();
    }
  }, [usuarioActual, grupo]);

  // El grupo ya viaja con su lista de usuarios (armada por el backend en
  // conciertoService/grupoService), asi que la confirmacion se deriva de
  // ahi en vez de pedirle al backend un chequeo aparte.
  async function verificarConfirmacion() {
    setVerificandoConfirmacion(true);
    const yaConfirmado = (grupo.usuarios || []).some(
      (u) => u.id_usuario === usuarioActual.id_usuario
    );
    setConfirmado(yaConfirmado);
    setVerificandoConfirmacion(false);
  }

  // Antes de unirse se muestran consejos de seguridad, salvo que la persona
  // haya marcado "no volver a mostrar".
  function pedirConfirmacionAsistencia() {
    if (consejosOcultos()) {
      confirmarAsistenciaGrupo();
    } else {
      setMostrarConsejos(true);
    }
  }

  async function confirmarAsistenciaGrupo() {
    if (!usuarioActual || !grupo || confirmado) return;

    setCargandoConfirmacion(true);

    try {
      // La notificación "grupo_unido" ya la crea el backend como parte de
      // grupoService.unirse, no hace falta dispararla desde acá.
      await gruposService.unirse(grupo.id_grupo);
    } catch (error) {
      console.error("Error al sumarse al grupo:", error);
      mostrarAviso("No se pudo confirmar la asistencia: " + error.message);
      setCargandoConfirmacion(false);
      return;
    }

    setConfirmado(true);
    setCargandoConfirmacion(false);
    setMostrarConsejos(false);
  }

  async function confirmarSalirDelGrupo() {
    setSaliendo(true);

    try {
      await gruposService.salir(grupo.id_grupo);
    } catch (error) {
      setSaliendo(false);
      console.error("Error al salir del grupo:", error);
      mostrarAviso("No se pudo salir del grupo: " + error.message);
      return;
    }

    setSaliendo(false);
    setMostrarConfirmarSalida(false);
    setConfirmado(false);
  }

  async function confirmarEliminarGrupo() {
    setEliminando(true);

    try {
      await gruposService.eliminar(grupo.id_grupo);
    } catch (error) {
      setEliminando(false);
      console.error("Error al eliminar el grupo:", error);
      mostrarAviso("No se pudo eliminar el grupo: " + error.message);
      return;
    }

    setEliminando(false);
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

        <ParticipantesGrupo
          participantes={grupo.usuarios}
          cupo={grupo.cupo}
          onVerFansConfirmados={onVerFansConfirmados}
        />

        <StatsGrupo grupo={grupo} />

        <DescripcionGrupo descripcion={grupo.descripcion} />

        <MapaGrupo ubicacion={grupo.ubicacion} />

        {!verificandoConfirmacion && !confirmado && completo && (
          <div className="confirmacionGrupo">
            <h3>Grupo completo</h3>
            <p>Ya se ocuparon los {grupo.cupo} lugares. Si alguien sale del grupo, se libera un lugar.</p>
          </div>
        )}

        {!verificandoConfirmacion && !confirmado && !completo && (
          <ConfirmacionGrupo
            onConfirmar={pedirConfirmacionAsistencia}
            cargandoConfirmacion={cargandoConfirmacion}
          />
        )}

        {!verificandoConfirmacion && confirmado && (
          <button
            className="botonChatGrupo"
            type="button"
            onClick={onAbrirChat}
          >
            Chat del grupo
          </button>
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

        {esCreador && onEditar && (
          <button className="botonEditarGrupo" type="button" onClick={onEditar}>
            Editar grupo
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

      {mostrarConsejos && (
        <ModalConsejosSeguridad
          confirmando={cargandoConfirmacion}
          onConfirmar={confirmarAsistenciaGrupo}
          onCancelar={() => setMostrarConsejos(false)}
        />
      )}

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