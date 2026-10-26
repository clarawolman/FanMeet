import { useContext, useState } from "react";
import { Campo, FilaBoton, Grupo } from "./piezas";
import { SesionContext } from "../../context/SesionContext";
import { UsuarioContext } from "../../context/UsuarioContext";
import { usuariosService } from "../../services/usuariosService";
import { mostrarAviso } from "../../utils/avisos";

// Mismas reglas que el registro y el backend (authValidators.js)
function problemaContrasena(contrasena) {
  if (contrasena.length < 8) return "Tiene que tener al menos 8 caracteres.";
  if (!/[A-Z]/.test(contrasena)) return "Tiene que tener al menos una mayúscula.";
  if (!/[a-z]/.test(contrasena)) return "Tiene que tener al menos una minúscula.";
  if (!/[0-9]/.test(contrasena)) return "Tiene que tener al menos un número.";
  if (!/[^A-Za-z0-9]/.test(contrasena)) return "Tiene que tener al menos un carácter especial.";
  return "";
}

function FormMail({ onListo }) {
  const { usuarioActual, setUsuarioActual } = useContext(UsuarioContext);
  const [mail, setMail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const actualizado = await usuariosService.cambiarMail(mail.trim(), contrasena);
      setUsuarioActual({ ...usuarioActual, mail: actualizado.mail });
      mostrarAviso("Listo, cambiaste tu mail. Desde ahora iniciás sesión con el nuevo.", "exito");
      onListo();
    } catch (error) {
      mostrarAviso(error.details?.[0]?.mensaje || error.message);
    }
    setGuardando(false);
  }

  return (
    <form className="configForm" onSubmit={enviar}>
      <Campo
        etiqueta="Mail nuevo"
        type="email"
        autoComplete="email"
        required
        value={mail}
        onChange={(e) => setMail(e.target.value)}
      />
      <Campo
        etiqueta="Tu contraseña"
        type="password"
        autoComplete="current-password"
        required
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        ayuda="Para confirmar que sos vos."
      />
      <div className="configFormAcciones">
        <button type="button" className="configBoton" onClick={onListo} disabled={guardando}>
          Cancelar
        </button>
        <button type="submit" className="fmBotonPrimario configBotonPrincipal" disabled={guardando}>
          {guardando ? "Guardando…" : "Cambiar mail"}
        </button>
      </div>
    </form>
  );
}

function FormContrasena({ onListo }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [guardando, setGuardando] = useState(false);

  const problema = nueva ? problemaContrasena(nueva) : "";
  const noCoinciden = repetida && repetida !== nueva;

  async function enviar(e) {
    e.preventDefault();
    if (problema || noCoinciden) return;
    setGuardando(true);
    try {
      await usuariosService.cambiarContrasena(actual, nueva);
      mostrarAviso("Contraseña cambiada.", "exito");
      onListo();
    } catch (error) {
      mostrarAviso(error.details?.[0]?.mensaje || error.message);
    }
    setGuardando(false);
  }

  return (
    <form className="configForm" onSubmit={enviar}>
      <Campo
        etiqueta="Contraseña actual"
        type="password"
        autoComplete="current-password"
        required
        value={actual}
        onChange={(e) => setActual(e.target.value)}
      />
      <Campo
        etiqueta="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        required
        value={nueva}
        onChange={(e) => setNueva(e.target.value)}
        ayuda={problema || "Mínimo 8 caracteres, con mayúscula, minúscula, número y un carácter especial."}
      />
      <Campo
        etiqueta="Repetí la contraseña nueva"
        type="password"
        autoComplete="new-password"
        required
        value={repetida}
        onChange={(e) => setRepetida(e.target.value)}
        ayuda={noCoinciden ? "No coinciden." : undefined}
      />
      <div className="configFormAcciones">
        <button type="button" className="configBoton" onClick={onListo} disabled={guardando}>
          Cancelar
        </button>
        <button
          type="submit"
          className="fmBotonPrimario configBotonPrincipal"
          disabled={guardando || Boolean(problema) || noCoinciden}
        >
          {guardando ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}

function FormEliminarCuenta({ onListo }) {
  const cerrarSesion = useContext(SesionContext);
  const [contrasena, setContrasena] = useState("");
  const [entiendo, setEntiendo] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!entiendo) return;
    setEliminando(true);
    try {
      await usuariosService.eliminarCuenta(contrasena);
    } catch (error) {
      mostrarAviso(error.details?.[0]?.mensaje || error.message);
      setEliminando(false);
      return;
    }
    mostrarAviso("Tu cuenta se eliminó. Gracias por haber sido parte de FanMeet.", "info");
    await cerrarSesion?.();
  }

  return (
    <form className="configForm" onSubmit={enviar}>
      <p className="configTexto">
        Se borran tu perfil, tus amistades, chats, conciertos, grupos en los que estás y tus momentos.
        Los momentos que compartís con otros les siguen apareciendo a ellos, y los grupos que creaste
        pasan a otro integrante. <strong>No se puede deshacer.</strong>
      </p>
      <Campo
        etiqueta="Tu contraseña"
        type="password"
        autoComplete="current-password"
        required
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
      />
      <label className="configCheck">
        <input type="checkbox" checked={entiendo} onChange={(e) => setEntiendo(e.target.checked)} />
        Entiendo que mi cuenta se borra para siempre
      </label>
      <div className="configFormAcciones">
        <button type="button" className="configBoton" onClick={onListo} disabled={eliminando}>
          Cancelar
        </button>
        <button type="submit" className="configBoton configBoton--peligroLleno" disabled={!entiendo || eliminando}>
          {eliminando ? "Eliminando…" : "Eliminar mi cuenta"}
        </button>
      </div>
    </form>
  );
}

export default function SeccionCuenta({ usuario, onNavegar }) {
  const cerrarSesion = useContext(SesionContext);
  // "mail" | "contrasena" | "eliminar": el formulario abierto
  const [abierto, setAbierto] = useState(null);
  const cerrar = () => setAbierto(null);

  return (
    <>
      <Grupo titulo="Perfil">
        <div className="configPerfil">
          <img src={usuario?.fotoperfil} alt="" />
          <div className="configFilaTexto">
            <strong>{usuario?.apodo || usuario?.nombre}</strong>
            <span>@{usuario?.nombre}</span>
          </div>
          <button type="button" className="configBoton" onClick={() => onNavegar("perfil")}>
            Editar perfil
          </button>
        </div>
      </Grupo>

      <Grupo titulo="Inicio de sesión">
        {abierto === "mail" ? (
          <FormMail onListo={cerrar} />
        ) : (
          <FilaBoton titulo="Mail" descripcion={usuario?.mail} texto="Cambiar" onClick={() => setAbierto("mail")} />
        )}
        {abierto === "contrasena" ? (
          <FormContrasena onListo={cerrar} />
        ) : (
          <FilaBoton titulo="Contraseña" descripcion="••••••••" texto="Cambiar" onClick={() => setAbierto("contrasena")} />
        )}
        <FilaBoton
          titulo="Cerrar sesión"
          descripcion="Salís de FanMeet en este dispositivo."
          texto="Cerrar sesión"
          onClick={cerrarSesion}
        />
      </Grupo>

      <Grupo titulo="Eliminar cuenta" peligro>
        {abierto === "eliminar" ? (
          <FormEliminarCuenta onListo={cerrar} />
        ) : (
          <FilaBoton
            titulo="Eliminar mi cuenta"
            descripcion="Borra tu cuenta y tus datos para siempre."
            texto="Eliminar"
            peligro
            onClick={() => setAbierto("eliminar")}
          />
        )}
      </Grupo>
    </>
  );
}
