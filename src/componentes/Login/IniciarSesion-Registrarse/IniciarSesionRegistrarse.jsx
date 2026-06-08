import "./IniciarSesionRegistrarse.css";

import LoginForm from "./loginForm";
import FondoLogin from "./fondoLogin";

function IniciarSesionRegistrarse({ onIngresar, onRegistrarse }) {
  return (
    <main className="pantallaLogin">
      <section className="loginContenido">
        <h1 className="loginTitulo">FanMeet</h1>

        <LoginForm
          onIngresar={onIngresar}
          onRegistrarse={onRegistrarse}
        />
      </section>

      <FondoLogin />
    </main>
  );
}

export default IniciarSesionRegistrarse;