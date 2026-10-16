import { useState } from "react";
import "./loginForm.css";
import { authService } from "../../../services/authService";

function LoginForm({ onIngresar, onRegistrarse, onMailSinConfirmar }) {
  const [usuarioOMail, setUsuarioOMail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);

  async function manejarLogin(e) {
    e.preventDefault();

    setErrorLogin("");

    if (!usuarioOMail || !contrasena) {
      setErrorLogin("Completá tu e-mail o usuario y la contraseña.");
      return;
    }

    setCargandoLogin(true);

    try {
      const usuarioOMailLimpio = usuarioOMail.trim();

      // Login vía la API de Node, que a su vez habla con Supabase Auth y
      // con la tabla "usuario" (mismo flujo y mismos mensajes que antes,
      // ver backend/src/services/authService.js).
      const usuarioPerfil = await authService.login(usuarioOMailLimpio, contrasena);

      setCargandoLogin(false);
      onIngresar(usuarioPerfil);
    } catch (error) {
      console.error(error);
      setCargandoLogin(false);
      // Cuenta creada pero sin confirmar: se lo lleva a ingresar el código.
      if (error.details?.codigo === "mail_no_confirmado") {
        onMailSinConfirmar(error.details.mail);
        return;
      }
      // Si el backend respondió con un error conocido (401), su mensaje ya
      // es el mismo texto que mostraba esta pantalla antes. Si fue un
      // fallo de red/servidor sin status, usamos el mensaje genérico de
      // siempre.
      setErrorLogin(error.status ? error.message : "No pudimos conectarnos. Probá de nuevo en un momento.");
    }
  }

  return (
    <form className="loginForm" onSubmit={manejarLogin} noValidate>
      <div className="loginCampo">
        <label htmlFor="login-usuario">E-mail o usuario</label>
        <input
          id="login-usuario"
          className="loginInput"
          type="text"
          autoComplete="username"
          value={usuarioOMail}
          onChange={(e) => setUsuarioOMail(e.target.value)}
        />
      </div>

      <div className="loginCampo">
        <label htmlFor="login-contrasena">Contraseña</label>
        <div className="passwordWrapper">
          <input
            id="login-contrasena"
            className="loginInput passwordInput"
            type={mostrarContrasena ? "text" : "password"}
            autoComplete="current-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />

          <button
            className="botonOjo"
            type="button"
            aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={mostrarContrasena}
            onClick={() => setMostrarContrasena(!mostrarContrasena)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {mostrarContrasena && <path d="M4 4l16 16" />}
            </svg>
          </button>
        </div>
      </div>

      {errorLogin && (
        <p className="fmAvisoError" role="alert">
          {errorLogin}
        </p>
      )}

      <button className="fmBotonPrimario botonIngresar" type="submit" disabled={cargandoLogin}>
        {cargandoLogin ? "Ingresando…" : "Ingresar"}
      </button>

      <p className="textoRegistro">
        ¿No tenés cuenta?{" "}
        <button className="linkRegistro" type="button" onClick={onRegistrarse}>
          Registrate
        </button>
      </p>
    </form>
  );
}

export default LoginForm;