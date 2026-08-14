import { useState } from "react";
import "./Registro1.css";
import { authService } from "../../../services/authService";

function Registro1({ datosIniciales = {}, onVolver, onSiguiente }) {
  const [nombre, setNombre] = useState(datosIniciales.nombre || "");
  const [mail, setMail] = useState(datosIniciales.mail || "");
  const [contrasena, setContrasena] = useState(datosIniciales.contrasena || "");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState(
    datosIniciales.fechanac || ""
  );
  const [genero, setGenero] = useState(datosIniciales.genero || "");
  const [errorRegistro, setErrorRegistro] = useState("");
  const [errorContrasena, setErrorContrasena] = useState("");
  const [cargando, setCargando] = useState(false);

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

  const condicionesContrasena = {
    mayuscula: /[A-ZÁÉÍÓÚÑ]/.test(contrasena),
    minuscula: /[a-záéíóúñ]/.test(contrasena),
    numero: /[0-9]/.test(contrasena),
    especial: /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/.test(contrasena),
    longitud: contrasena.length >= 8,
  };

  const contrasenaValida = Object.values(condicionesContrasena).every(Boolean);

  async function manejarSiguiente(e) {
    e.preventDefault();

    const nombreLimpio = nombre.trim();
    const mailLimpio = mail.trim().toLowerCase();

    setErrorRegistro("");
    setErrorContrasena("");

    if (
      !nombreLimpio ||
      !mailLimpio ||
      !contrasena ||
      !fechaNacimiento ||
      !genero
    ) {
      setErrorRegistro("Completá todos los campos para continuar");
      return;
    }

    if (!mailLimpio.includes("@")) {
      setErrorRegistro("Ingresá un mail válido");
      return;
    }

    const edad = calcularEdad(fechaNacimiento);

    if (edad < 15) {
      setErrorRegistro("Debés tener al menos 15 años para registrarte");
      return;
    }

    if (!contrasenaValida) {
      setErrorContrasena("La contraseña debe cumplir todos los requisitos");
      return;
    }

    setCargando(true);

    // Reemplaza los 3 chequeos directos a Supabase (mail en "usuario", RPC
    // mail_existe_en_auth, nombre en "usuario") por una sola llamada al
    // backend, que hace exactamente esos 3 chequeos en el mismo orden y
    // devuelve los mismos mensajes.
    try {
      const resultado = await authService.verificarDisponibilidadRegistro(
        nombreLimpio,
        mailLimpio
      );

      if (!resultado.disponible) {
        setErrorRegistro(resultado.mensaje);
        setCargando(false);
        return;
      }
    } catch (error) {
      setErrorRegistro(error.message || "Hubo un error al verificar los datos");
      setCargando(false);
      return;
    }

    setCargando(false);
    setErrorRegistro("");
    setErrorContrasena("");

    onSiguiente({
      nombre: nombreLimpio,
      mail: mailLimpio,
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

        <form
          className="registroFormulario"
          onSubmit={manejarSiguiente}
          autoComplete="off"
        >
          <label className="registroCampo">
            <span>
              Nombre de usuario <span className="registroObligatorio">*</span>
            </span>

            <div className="registroInputWrapper">
              <span className="registroIcono">♙</span>

              <input
                type="text"
                name="fanmeet-registro-nombre"
                autoComplete="off"
                placeholder="Nombre de usuario"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
          </label>

          <label className="registroCampo">
            <span>
              Mail <span className="registroObligatorio">*</span>
            </span>

            <div className="registroInputWrapper">
              <span className="registroIcono">@</span>

              <input
                type="email"
                name="fanmeet-registro-mail"
                autoComplete="off"
                placeholder="ejemplo@mail.com"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
              />
            </div>
          </label>

          <label className="registroCampo">
            <span>
              Contraseña <span className="registroObligatorio">*</span>
            </span>

            <div className="registroInputWrapper registroPasswordWrapper">
              <span className="registroIcono">◉</span>

              <input
                type={mostrarContrasena ? "text" : "password"}
                name="fanmeet-registro-password"
                autoComplete="new-password"
                placeholder="Ingrese su contraseña"
                value={contrasena}
                onChange={(e) => {
                  setContrasena(e.target.value);
                  setErrorContrasena("");
                }}
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

            <ul className="registroCondicionesPassword">
              <li className={condicionesContrasena.mayuscula ? "cumplida" : ""}>
                Una mayúscula
              </li>

              <li className={condicionesContrasena.minuscula ? "cumplida" : ""}>
                Una minúscula
              </li>

              <li className={condicionesContrasena.numero ? "cumplida" : ""}>
                Un número
              </li>

              <li className={condicionesContrasena.especial ? "cumplida" : ""}>
                Un carácter especial
              </li>

              <li className={condicionesContrasena.longitud ? "cumplida" : ""}>
                Mínimo 8 caracteres
              </li>
            </ul>

            {errorContrasena && (
              <p className="registroPasswordError">{errorContrasena}</p>
            )}
          </label>

          <label className="registroCampo">
            <span>
              Fecha de nacimiento <span className="registroObligatorio">*</span>
            </span>

            <div className="registroInputWrapper">
              <span className="registroIcono">▣</span>

              <input
                type="date"
                name="fanmeet-registro-fecha"
                autoComplete="off"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
              />
            </div>
          </label>

          <label className="registroCampo">
            <span>
              Género <span className="registroObligatorio">*</span>
            </span>

            <div className="registroInputWrapper registroSelectWrapper">
              <span className="registroIcono">♁</span>

              <select
                name="fanmeet-registro-genero"
                autoComplete="off"
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

              <span className="registroSelectFlecha"></span>
            </div>
          </label>

          {errorRegistro && <p className="registroError">{errorRegistro}</p>}

          <button
            className="registroBotonSiguiente"
            type="submit"
            disabled={cargando}
          >
            {cargando ? "Verificando..." : "Siguiente"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Registro1;