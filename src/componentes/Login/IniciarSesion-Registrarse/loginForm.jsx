import { useState } from "react";
import "./loginForm.css";
import { authService } from "../../../services/authService";

function LoginForm({ onIngresar, onRegistrarse }) {
  const [usuarioOMail, setUsuarioOMail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);

  async function manejarLogin(e) {
    e.preventDefault();

    setErrorLogin("");

    if (!usuarioOMail || !contrasena) {
      setErrorLogin("Ingrese usuario/mail y contraseña");
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
      // Si el backend respondió con un error conocido (401), su mensaje ya
      // es el mismo texto que mostraba esta pantalla antes. Si fue un
      // fallo de red/servidor sin status, usamos el mensaje genérico de
      // siempre.
      setErrorLogin(error.status ? error.message : "Error al iniciar sesión");
      setCargandoLogin(false);
    }
  }

  return (
    <form className="loginForm" onSubmit={manejarLogin}>
      <input
        className="loginInput"
        type="text"
        placeholder="Ingrese su e-mail o usuario"
        value={usuarioOMail}
        onChange={(e) => setUsuarioOMail(e.target.value)}
      />

      <div className="passwordWrapper">
        <input
          className="loginInput passwordInput"
          type={mostrarContrasena ? "text" : "password"}
          placeholder="Agregue una contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />

        <button
          className="botonOjo"
          type="button"
          aria-label="Mostrar contraseña"
          onClick={() => setMostrarContrasena(!mostrarContrasena)}
        >
          <span className="ojoIcono"></span>
        </button>
      </div>

      {errorLogin && <p className="errorLogin">{errorLogin}</p>}

      <button className="botonIngresar" type="submit" disabled={cargandoLogin}>
        {cargandoLogin ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="textoRegistro">
        ¿No tiene una cuenta?{" "}
        <button className="linkRegistro" type="button" onClick={onRegistrarse}>
          Regístrese
        </button>
      </p>
    </form>
  );
}

export default LoginForm;