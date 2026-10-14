import "./IniciarSesionRegistrarse.css";

import LoginForm from "./loginForm";
import imLogo from "../../../assets/imLogo.png";

function IniciarSesionRegistrarse({ onIngresar, onRegistrarse }) {
  return (
    <main className="pantallaLogin">
      <section className="loginContenido">
        <div className="loginMarca">
          <img className="loginMarcaLogo" src={imLogo} alt="" />
          <span>FanMeet</span>
        </div>

        <h1 className="loginTitulo">Encontrá con quién ir al próximo recital.</h1>
        <p className="loginBajada">
          Entrá para ver tus conciertos, tus grupos y a los fans que van al mismo show.
        </p>

        <LoginForm onIngresar={onIngresar} onRegistrarse={onRegistrarse} />
      </section>
    </main>
  );
}

export default IniciarSesionRegistrarse;
