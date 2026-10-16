import { useEffect, useState } from "react";
import "../Registro1/Registro1.css";
import "./VerificarMail.css";
import { authService } from "../../../services/authService";

const SEGUNDOS_ENTRE_REENVIOS = 60;

// Pantalla que se muestra después de registrarse (o al intentar ingresar
// con una cuenta sin confirmar): pide el código que Supabase manda al mail.
// Si se llega desde el login, enviarAlEntrar manda un código nuevo, porque
// el del registro pudo haber vencido.
function VerificarMail({ mail, enviarAlEntrar = false, onVerificado, onVolver }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [espera, setEspera] = useState(enviarAlEntrar ? 0 : SEGUNDOS_ENTRE_REENVIOS);

  useEffect(() => {
    if (espera <= 0) return;
    const temporizador = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(temporizador);
  }, [espera]);

  useEffect(() => {
    if (enviarAlEntrar) reenviar();
    // Solo al montar la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reenviar() {
    setError("");
    setAviso("");
    try {
      await authService.reenviarCodigo(mail);
      setAviso("Te mandamos un código nuevo.");
      setEspera(SEGUNDOS_ENTRE_REENVIOS);
    } catch (errorReenvio) {
      setError(errorReenvio.message || "No se pudo reenviar el código");
    }
  }

  async function manejarVerificar(e) {
    e.preventDefault();
    setError("");
    setAviso("");

    const codigoLimpio = codigo.trim();
    if (!/^[0-9]{6,10}$/.test(codigoLimpio)) {
      setError("Ingresá el código que te llegó por mail");
      return;
    }

    setVerificando(true);
    try {
      const usuario = await authService.verificarCodigo(mail, codigoLimpio);
      await onVerificado(usuario);
    } catch (errorVerificacion) {
      setError(errorVerificacion.message || "No se pudo verificar el código");
      setVerificando(false);
    }
  }

  return (
    <main className="pantallaRegistro1">
      <header className="registroHeader">
        <button className="registroVolver" type="button" onClick={onVolver}>
          ←
        </button>

        <h1 className="registroLogo">FanMeet</h1>
      </header>

      <section className="registroContenido">
        <h2 className="registroTitulo">Confirmá tu mail</h2>

        <p className="verificarTexto">
          Te mandamos un código a <strong>{mail}</strong>. Ingresalo para terminar
          de crear tu cuenta. Si no lo ves, revisá en spam.
        </p>

        <form className="registroFormulario" onSubmit={manejarVerificar} autoComplete="off">
          <label className="registroCampo">
            <span>Código</span>

            <div className="registroInputWrapper">
              <input
                className="verificarCodigoInput"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                placeholder="123456"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
            </div>
          </label>

          {error && <p className="registroError">{error}</p>}
          {aviso && <p className="verificarAviso">{aviso}</p>}

          <button className="registroBotonSiguiente" type="submit" disabled={verificando}>
            {verificando ? "Verificando..." : "Confirmar"}
          </button>
        </form>

        <p className="verificarReenviar">
          ¿No te llegó?{" "}
          <button
            className="verificarLink"
            type="button"
            onClick={reenviar}
            disabled={espera > 0}
          >
            {espera > 0 ? `Reenviar en ${espera}s` : "Reenviar código"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default VerificarMail;
