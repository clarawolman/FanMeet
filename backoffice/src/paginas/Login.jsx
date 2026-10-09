import { useState } from "react";
import { api } from "../api";

export default function Login({ aviso, onIngresar }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function manejarEnviar(e) {
    e.preventDefault();
    setEntrando(true);
    setError("");
    try {
      await api.login(usuario.trim(), contrasena);
      await onIngresar();
    } catch (err) {
      setError(err.message);
      setEntrando(false);
    }
  }

  return (
    <div className="pantallaLogin">
      <form className="tarjeta loginCaja" onSubmit={manejarEnviar}>
        <img src="/Favicon.png" alt="" className="loginLogo" />
        <h1>Backoffice</h1>
        <p className="textoSuave">Entrá con tu cuenta de moderador de FanMeet.</p>

        {aviso && <p className="mensajeError">{aviso}</p>}

        <label>
          Usuario o mail
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="mensajeError">{error}</p>}

        <button className="boton botonPrincipal" type="submit" disabled={entrando}>
          {entrando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
