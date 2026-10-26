import { useState } from "react";
import { Grupo, Opciones } from "./piezas";
import { usuariosService } from "../../services/usuariosService";
import { mostrarAviso } from "../../utils/avisos";
import { version } from "../../../package.json";

const TIPOS = [
  { valor: "problema", texto: "Algo no funciona" },
  { valor: "sugerencia", texto: "Tengo una idea" },
];

const PREGUNTAS = [
  {
    pregunta: "¿Cómo encuentro gente para ir a un recital?",
    respuesta:
      "Entrá al concierto y unite: vas a ver a los fans que van y los grupos que se armaron (previa, viaje, after). Sumate a uno o creá el tuyo. En Descubrir te sugerimos fans con gustos parecidos.",
  },
  {
    pregunta: "¿Qué es un momento?",
    respuesta:
      "Una publicación con fotos de un recital. Podés elegir el concierto, contar cómo fue y etiquetar a tus amigos: si aceptan, el momento aparece también en su perfil.",
  },
  {
    pregunta: "¿Por qué no puedo escribirle a alguien?",
    respuesta:
      "El chat privado es solo entre amigos. Mandale una solicitud desde su perfil; cuando la acepte, ya pueden hablar. También puede pasar que esa persona haya apagado los mensajes.",
  },
  {
    pregunta: "¿Para qué sirve conectar Last.fm?",
    respuesta:
      "Con lo que escuchás te sugerimos mejor gente y conciertos, y en tu perfil se ve tu música del último mes. Lo podés ocultar en Privacidad o desconectarlo cuando quieras.",
  },
  {
    pregunta: "¿Cómo reporto o bloqueo a alguien?",
    respuesta:
      "Desde su perfil, con Reportar o Bloquear. Un reporte lo revisa el equipo de moderación. A los que bloqueaste los ves en Configuración → Privacidad.",
  },
  {
    pregunta: "¿Quién es Fani?",
    respuesta:
      "La asistente de FanMeet: te recomienda shows y grupos y te puede sumar a uno si se lo pedís. Si no la querés ver, apagala en Apariencia y Fani.",
  },
];

const TERMINOS = [
  "FanMeet es una red para conocer gente que va a los mismos recitales. Para usarla tenés que tener al menos 15 años y dar datos reales al registrarte.",
  "Sos responsable de lo que publicás: fotos, comentarios y mensajes. No se permiten insultos, acoso, discriminación, contenido sexual ni violento, spam ni la venta de entradas.",
  "Podemos sacar contenido o suspender cuentas que no cumplan estas reglas, sobre todo si otros las reportan.",
  "Los encuentros con otros fans son responsabilidad de cada persona. Te recomendamos juntarte en lugares públicos y avisarle a alguien de confianza.",
  "FanMeet no vende entradas ni está asociada a los artistas, productoras o estadios que aparecen en la app.",
];

const PRIVACIDAD = [
  "Guardamos los datos de tu registro (mail, nombre de usuario, fecha de nacimiento, género), lo que publicás y a qué conciertos y grupos te unís.",
  "Tu mail y tu fecha de nacimiento no los ve nadie más; en tu perfil se muestra tu edad.",
  "Si conectás Last.fm, leemos lo que escuchaste en el último mes para sugerirte gente y shows. No publicamos nada en tu cuenta.",
  "Los mensajes que le mandás a Fani se procesan con un servicio de inteligencia artificial para poder responderte.",
  "No vendemos tus datos. Podés eliminar tu cuenta y todo lo tuyo desde Configuración → Cuenta.",
];

function FormContacto() {
  const [tipo, setTipo] = useState("problema");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await usuariosService.enviarSugerencia(tipo, texto.trim());
      setTexto("");
      mostrarAviso("¡Gracias! Lo recibimos y lo vamos a leer.", "exito");
    } catch (error) {
      mostrarAviso(error.details?.[0]?.mensaje || error.message);
    }
    setEnviando(false);
  }

  return (
    <form className="configForm" onSubmit={enviar}>
      <Opciones titulo="¿Qué nos querés contar?" opciones={TIPOS} valor={tipo} onCambiar={setTipo} />
      <label className="configCampo">
        <span className="configCampoEtiqueta">
          {tipo === "problema" ? "Qué pasó y dónde" : "Tu idea"}
        </span>
        <textarea
          className="configInput configTextarea"
          rows={4}
          maxLength={2000}
          required
          minLength={10}
          placeholder={
            tipo === "problema"
              ? "Ej: cuando quiero subir un momento desde el celu, se queda cargando."
              : "Ej: me gustaría poder armar una lista de los recitales a los que fui."
          }
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      </label>
      <div className="configFormAcciones">
        <button
          type="submit"
          className="fmBotonPrimario configBotonPrincipal"
          disabled={enviando || texto.trim().length < 10}
        >
          {enviando ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </form>
  );
}

function Desplegable({ titulo, children }) {
  return (
    <details className="configDesplegable">
      <summary>{titulo}</summary>
      <div className="configDesplegableCuerpo">{children}</div>
    </details>
  );
}

export default function SeccionAyuda() {
  return (
    <>
      <Grupo titulo="Contactanos" descripcion="Le llega al equipo de FanMeet.">
        <FormContacto />
      </Grupo>

      <Grupo titulo="Preguntas frecuentes">
        {PREGUNTAS.map(({ pregunta, respuesta }) => (
          <Desplegable key={pregunta} titulo={pregunta}>
            <p>{respuesta}</p>
          </Desplegable>
        ))}
      </Grupo>

      <Grupo titulo="Legales">
        <Desplegable titulo="Términos y condiciones">
          <ul>
            {TERMINOS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Desplegable>
        <Desplegable titulo="Política de privacidad">
          <ul>
            {PRIVACIDAD.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Desplegable>
      </Grupo>

      <p className="configVersion">FanMeet · versión {version}</p>
    </>
  );
}
