import { useState } from "react";
import "./loginForm.css";
import { supabase } from "../../../supabase";

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

      let mailParaLogin = usuarioOMailLimpio;

      // Supabase Auth inicia sesión con MAIL.
      // Si la persona escribió su nombre de usuario, primero buscamos su mail.
      if (!usuarioOMailLimpio.includes("@")) {
        const { data: usuarioEncontrado, error: errorUsuario } = await supabase
          .from("usuario")
          .select("mail")
          .eq("nombre", usuarioOMailLimpio)
          .single();

        if (errorUsuario || !usuarioEncontrado) {
          setErrorLogin("Este usuario no existe");
          setCargandoLogin(false);
          return;
        }

        mailParaLogin = usuarioEncontrado.mail;
      }

      // Login real con Supabase Auth.
      // Acá Supabase genera y maneja el JWT automáticamente.
      const { data: authData, error: errorAuth } =
        await supabase.auth.signInWithPassword({
          email: mailParaLogin,
          password: contrasena,
        });

      if (errorAuth) {
        setErrorLogin("Usuario/mail o contraseña incorrectos");
        setCargandoLogin(false);
        return;
      }

      // Buscamos el perfil completo de FanMeet en tu tabla usuario.
      const { data: usuarioPerfil, error: errorPerfil } = await supabase
        .from("usuario")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single();

      if (errorPerfil || !usuarioPerfil) {
        setErrorLogin("No se pudo cargar el perfil del usuario");
        setCargandoLogin(false);
        return;
      }

      setCargandoLogin(false);
      onIngresar(usuarioPerfil);
    } catch (error) {
      console.error(error);
      setErrorLogin("Error al iniciar sesión");
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