import { useContext, useState } from "react";
import { FilaBoton, Grupo, Interruptor, Opciones } from "./piezas";
import ModalConfirmacion from "../generales/ModalConfirmacion";
import { TemaContext } from "../../context/TemaContext";
import { chatbotService } from "../../services/chatbotService";
import { mostrarAviso } from "../../utils/avisos";

const TEMAS = [
  { valor: "light", texto: "Claro" },
  { valor: "dark", texto: "Oscuro" },
  { valor: "system", texto: "Según el dispositivo" },
];

const TAMANOS = [
  { valor: "normal", texto: "Normal" },
  { valor: "grande", texto: "Grande" },
  { valor: "enorme", texto: "Más grande" },
];

export default function SeccionApariencia({ preferencias, onGuardarPreferencias }) {
  const {
    modoTema,
    elegirTema,
    tamanoTexto,
    elegirTamanoTexto,
    reducirAnimaciones,
    elegirReducirAnimaciones,
  } = useContext(TemaContext);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [borrando, setBorrando] = useState(false);

  async function borrarConversacion() {
    setBorrando(true);
    try {
      await chatbotService.borrarHistorial();
      mostrarAviso("Borraste la conversación con Fani.", "exito");
      setConfirmarBorrado(false);
    } catch (error) {
      mostrarAviso("No se pudo borrar: " + error.message);
    }
    setBorrando(false);
  }

  return (
    <>
      <Grupo titulo="Apariencia" descripcion="Se guarda en este dispositivo.">
        <Opciones titulo="Tema" opciones={TEMAS} valor={modoTema} onCambiar={elegirTema} />
        <Opciones titulo="Tamaño del texto" opciones={TAMANOS} valor={tamanoTexto} onCambiar={elegirTamanoTexto} />
        <Interruptor
          titulo="Reducir animaciones"
          descripcion="Menos movimiento en pantalla."
          activo={reducirAnimaciones}
          onCambiar={elegirReducirAnimaciones}
        />
      </Grupo>

      <Grupo titulo="Fani, la asistente">
        <Interruptor
          titulo="Mostrar a Fani"
          descripcion="El botón del inicio y su chat. Te ayuda a encontrar shows y grupos."
          activo={preferencias.fani}
          onCambiar={(v) => onGuardarPreferencias({ fani: v })}
        />
        <FilaBoton
          titulo="Borrar la conversación"
          descripcion="Fani se olvida de todo lo que hablaron."
          texto="Borrar"
          peligro
          onClick={() => setConfirmarBorrado(true)}
        />
      </Grupo>

      {confirmarBorrado && (
        <ModalConfirmacion
          mensaje="¿Borrar toda la conversación con Fani? No se puede deshacer."
          textoConfirmar="Borrar"
          confirmando={borrando}
          onConfirmar={borrarConversacion}
          onCancelar={() => setConfirmarBorrado(false)}
        />
      )}
    </>
  );
}
