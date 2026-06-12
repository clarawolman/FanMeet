import { useState } from "react";
import "./Registro1.css";

function Registro1({ onVolver, onSiguiente }) {
  const [nombre, setNombre] = useState("");
  const [mail, setMail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState("");
  const [errorRegistro, setErrorRegistro] = useState("");

  function calcularEdad(fecha) {
    const hoy = new Date();
    const nacimiento = new Date(fecha);

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  function manejarSiguiente(e) {
    e.preventDefault();

    if (!nombre || !mail || !contrasena || !fechaNacimiento || !genero) {
      setErrorRegistro("Completá todos los campos para continuar");
      return;
    }

    if (!mail.includes("@")) {
      setErrorRegistro("Ingresá un mail válido");
      return;
    }

    const edad = calcularEdad(fechaNacimiento);

    if (edad < 15) {
      setErrorRegistro("Debés tener al menos 15 años para registrarte");
      return;
    }

    setErrorRegistro("");

    onSiguiente({
      nombre,
      mail,
      contrasena,
      fechanac: fechaNacimiento,
      genero,
    });
  }

  return (
    <main className="pantallaRegistro1">
      <header className="registroHeader">
        <button className="registroVolver" type="button" onClick={onVolver}>
          ←
        </button>

        <h1 className="registroLogo">FanMeet</h1>
      </header>

      <section className="registroContenido">
        <div className="registroProgresoInfo">
          <span>PASO 1 DE 3</span>
          <span>33%</span>
        </div>

        <div className="registroBarra">
          <div className="registroBarraActiva"></div>
        </div>

        <h2 className="registroTitulo">Bienvenido a FanMeet</h2>

        <form className="registroFormulario" onSubmit={manejarSiguiente}>
          <label className="registroCampo">
            <span>Nombre de usuario</span>

            <div className="registroInputWrapper">
              <span className="registroIcono">♙</span>
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          </label>

          <label className="registroCampo">
            <span>Mail</span>

            <div className="registroInputWrapper">
              <span className="registroIcono">@</span>
              <input
                type="email"
                placeholder="ejemplo@mail.com"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
              />
            </div>
          </label>

          <label className="registroCampo">
            <span>Contraseña</span>

            <div className="registroInputWrapper registroPasswordWrapper">
              <span className="registroIcono">◉</span>

              <input
                type={mostrarContrasena ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />

              <button
                className="registroBotonOjo"
                type="button"
                aria-label="Mostrar contraseña"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
              >
                <span className="registroOjoIcono"></span>
              </button>
            </div>
          </label>

          <label className="registroCampo">
            <span>Fecha de nacimiento</span>

            <div className="registroInputWrapper">
              <span className="registroIcono">▣</span>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
              />
            </div>
          </label>

          <label className="registroCampo">
            <span>Género</span>

            <div className="registroInputWrapper">
              <span className="registroIcono">♁</span>

              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
              >
                <option value="" disabled>
                  Seleccione su género
                </option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </label>

          {errorRegistro && <p className="registroError">{errorRegistro}</p>}

          <button className="registroBotonSiguiente" type="submit">
            Siguiente
          </button>
        </form>
      </section>
    </main>
  );
}

export default Registro1;