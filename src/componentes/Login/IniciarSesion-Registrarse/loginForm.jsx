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

    const { data: usuarios, error } = await supabase
      .from("usuario")
      .select("*")
      .eq("contrasena", contrasena)
      .or(`mail.eq.${usuarioOMail},nombre.eq.${usuarioOMail}`);

    if (error) {
      setErrorLogin("Error al iniciar sesión");
      setCargandoLogin(false);
      return;
    }

    if (!usuarios || usuarios.length === 0) {
      setErrorLogin("Este usuario no existe");
      setCargandoLogin(false);
      return;
    }

    setCargandoLogin(false);
    onIngresar(usuarios[0]);
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