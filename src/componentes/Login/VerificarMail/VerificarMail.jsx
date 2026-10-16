import { useEffect, useRef, useState } from "react";
import "../Registro1/Registro1.css";
import "./VerificarMail.css";
import EncabezadoRegistro from "../EncabezadoRegistro";
import { authService } from "../../../services/authService";

const SEGUNDOS_ENTRE_REENVIOS = 60;
// Igual al "Email OTP Length" de Supabase.
const LARGO_CODIGO = 8;

// Pantalla que se muestra después de registrarse (o al intentar ingresar
// con una cuenta sin confirmar): pide el código que Supabase manda al mail.
// Si se llega desde el login, enviarAlEntrar manda un código nuevo, porque
// el del registro pudo haber vencido.
function VerificarMail({ mail, enviarAlEntrar = false, onVerificado, onVolver }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [enfocado, setEnfocado] = useState(true);
  const [espera, setEspera] = useState(enviarAlEntrar ? 0 : SEGUNDOS_ENTRE_REENVIOS);
  const inputRef = useRef(null);

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

  async function verificar(codigoAVerificar) {
    setError("");
    setAviso("");

    if (codigoAVerificar.length !== LARGO_CODIGO) {
      setError(`Ingresá los ${LARGO_CODIGO} números que te llegaron por mail.`);
      return;
    }

    setVerificando(true);
    try {
      const usuario = await authService.verificarCodigo(mail, codigoAVerificar);
      await onVerificado(usuario);
    } catch (errorVerificacion) {
      setError(errorVerificacion.message || "No se pudo verificar el código");
      setCodigo("");
      setVerificando(false);
      inputRef.current?.focus();
    }
  }

  function manejarCambio(e) {
    const valor = e.target.value.replace(/\D/g, "").slice(0, LARGO_CODIGO);
    setCodigo(valor);
    setError("");
    // Con el último número (o al pegar el código entero) se confirma solo.
    if (valor.length === LARGO_CODIGO && !verificando) verificar(valor);
  }

  function manejarSubmit(e) {
    e.preventDefault();
    verificar(codigo);
  }

  // La caja activa es la siguiente a completar; con todo lleno, la última.
  const indiceActivo = Math.min(codigo.length, LARGO_CODIGO - 1);

  return (
    <main className="regPantalla">
      <EncabezadoRegistro onVolver={onVolver} />

      <section className="registroContenido verificarContenido">
        <div className="verificarIcono" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="M3.5 7l8.5 6 8.5-6" />
          </svg>
        </div>

        <h1 className="regTitulo">Revisá tu mail</h1>
        <p className="regBajada">
          Te mandamos un código de {LARGO_CODIGO} números a{" "}
          <strong className="verificarMail">{mail}</strong>. Si no lo ves, fijate en spam.
        </p>

        <form className="verificarFormulario" onSubmit={manejarSubmit} autoComplete="off" noValidate>
          <label className="verificarEtiqueta" htmlFor="verificar-codigo">
            Código de verificación
          </label>

          <div
            className={`verificarCajas${error ? " conError" : ""}`}
            style={{ "--verificar-largo": LARGO_CODIGO }}
            onClick={() => inputRef.current?.focus()}
          >
            {/* Un solo input real (pegar, autocompletar del teléfono, lector
                de pantalla) sobre las cajas que solo muestran los números. */}
            <input
              id="verificar-codigo"
              ref={inputRef}
              className="verificarInputReal"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={LARGO_CODIGO}
              value={codigo}
              onChange={manejarCambio}
              onFocus={() => setEnfocado(true)}
              onBlur={() => setEnfocado(false)}
              disabled={verificando}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "verificar-error" : undefined}
              autoFocus
            />

            {Array.from({ length: LARGO_CODIGO }, (_, i) => {
              const clases = ["verificarCaja"];
              if (codigo[i]) clases.push("llena");
              if (enfocado && !verificando && i === indiceActivo) clases.push("activa");
              return (
                <span key={i} className={clases.join(" ")} aria-hidden="true">
                  {codigo[i] || ""}
                </span>
              );
            })}
          </div>

          {error && (
            <p id="verificar-error" className="fmAvisoError verificarMensaje" role="alert">
              {error}
            </p>
          )}
          {aviso && (
            <p className="verificarAviso verificarMensaje" role="status">
              {aviso}
            </p>
          )}

          <button
            className="fmBotonPrimario regBotonSiguiente verificarBoton"
            type="submit"
            disabled={verificando || codigo.length !== LARGO_CODIGO}
          >
            {verificando ? "Verificando..." : "Confirmar"}
          </button>
        </form>

        <p className="verificarReenviar">
          ¿No te llegó?{" "}
          <button className="verificarLink" type="button" onClick={reenviar} disabled={espera > 0}>
            {espera > 0 ? `Reenviar en ${espera}s` : "Reenviar código"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default VerificarMail;
