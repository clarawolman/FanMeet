import "./IniciarSesionRegistrarse.css";

import LoginForm from "./loginForm";
import Marca, { IconoMarca } from "../../generales/Marca";

function IniciarSesionRegistrarse({ onIngresar, onRegistrarse, onMailSinConfirmar }) {
  return (
    <main className="pantallaLogin">
      <section className="loginContenido">
        <Marca className="loginMarca" as="p" />

        <h1 className="loginTitulo">Encontrá con quién ir al próximo recital.</h1>
        <p className="loginBajada">
          Entrá para ver tus conciertos, tus grupos y a los fans que van al mismo show.
        </p>

        <LoginForm
          onIngresar={onIngresar}
          onRegistrarse={onRegistrarse}
          onMailSinConfirmar={onMailSinConfirmar}
        />
      </section>

      {/* Solo escritorio: panel de marca al costado del formulario */}
      <aside className="loginPanel" aria-hidden="true">
        <IconoMarca className="loginPanelMarca" />
        <div className="loginPanelTexto">
          <p className="loginPanelEtiqueta">Pre · Show · After</p>
          <p className="loginPanelFrase">
            Ir solo a un recital
            <br />
            ya fue.
          </p>
          <ul className="loginPanelLista">
            <li>Unite al concierto con tu código de entrada</li>
            <li>Armá o sumate a grupos para la previa y el after</li>
            <li>Conocé fans que escuchan lo mismo que vos</li>
          </ul>
        </div>
      </aside>
    </main>
  );
}

export default IniciarSesionRegistrarse;
