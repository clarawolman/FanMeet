import { useState } from "react";
import "./Registro1.css";
import EncabezadoRegistro from "../EncabezadoRegistro";
import { authService } from "../../../services/authService";

function Registro1({ datosIniciales = {}, onVolver, onSiguiente }) {
  const [nombre, setNombre] = useState(datosIniciales.nombre || "");
  const [apodo, setApodo] = useState(datosIniciales.apodo || "");
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
      setErrorRegistro("Completá todos los campos para seguir.");
      return;
    }

    if (!mailLimpio.includes("@")) {
      setErrorRegistro("Revisá el e-mail: le falta la @.");
      return;
    }

    const edad = calcularEdad(fechaNacimiento);

    if (edad < 15) {
      setErrorRegistro("Tenés que tener al menos 15 años para registrarte.");
      return;
    }

    if (!contrasenaValida) {
      setErrorContrasena("A la contraseña le falta cumplir algún requisito.");
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
      setErrorRegistro(error.message || "No pudimos verificar tus datos. Probá de nuevo.");
      setCargando(false);
      return;
    }

    setCargando(false);
    setErrorRegistro("");
    setErrorContrasena("");

    onSiguiente({
      nombre: nombreLimpio,
      apodo: apodo.trim(),
      mail: mailLimpio,
      contrasena,
      fechanac: fechaNacimiento,
      genero,
    });
  }

  const condiciones = [
    ["mayuscula", "Una mayúscula"],
    ["minuscula", "Una minúscula"],
    ["numero", "Un número"],
    ["especial", "Un carácter especial"],
    ["longitud", "Mínimo 8 caracteres"],
  ];

  return (
    <main className="regPantalla">
      <EncabezadoRegistro paso={1} onVolver={onVolver} />

      <section className="registroContenido">
        <h1 className="regTitulo">Creá tu cuenta</h1>
        <p className="regBajada">Con esto te encuentran los fans que van a los mismos shows que vos.</p>

        <form className="registroFormulario" onSubmit={manejarSiguiente} autoComplete="off" noValidate>
          <div className="registroCampo">
            <label htmlFor="reg-nombre">Nombre de usuario</label>
            <input
              id="reg-nombre"
              className="registroInput"
              type="text"
              name="fanmeet-registro-nombre"
              autoComplete="off"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="registroCampo">
            <label htmlFor="reg-apodo">
              Nombre <span className="registroOpcional">(opcional)</span>
            </label>
            <input
              id="reg-apodo"
              className="registroInput"
              type="text"
              name="fanmeet-registro-apodo"
              autoComplete="off"
              maxLength={30}
              placeholder=""
              value={apodo}
              onChange={(e) => setApodo(e.target.value)}
            />
          </div>

          <div className="registroCampo registroCampoAncho">
            <label htmlFor="reg-mail">E-mail</label>
            <input
              id="reg-mail"
              className="registroInput"
              type="email"
              name="fanmeet-registro-mail"
              autoComplete="off"
              placeholder="nombre@mail.com"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
            />
          </div>

          <div className="registroCampo registroCampoPassword">
            <label htmlFor="reg-password">Contraseña</label>
            <div className="registroPasswordWrapper">
              <input
                id="reg-password"
                className="registroInput"
                type={mostrarContrasena ? "text" : "password"}
                name="fanmeet-registro-password"
                autoComplete="new-password"
                aria-describedby="reg-password-condiciones"
                value={contrasena}
                onChange={(e) => {
                  setContrasena(e.target.value);
                  setErrorContrasena("");
                }}
              />

              <button
                className="registroBotonOjo"
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

            <ul className="registroCondicionesPassword" id="reg-password-condiciones">
              {condiciones.map(([clave, texto]) => (
                <li key={clave} className={condicionesContrasena[clave] ? "cumplida" : ""}>
                  {texto}
                </li>
              ))}
            </ul>

            {errorContrasena && (
              <p className="fmAvisoError registroPasswordError" role="alert">
                {errorContrasena}
              </p>
            )}
          </div>

          <div className="registroCampo">
            <label htmlFor="reg-fecha">Fecha de nacimiento</label>
            <input
              id="reg-fecha"
              className="registroInput"
              type="date"
              name="fanmeet-registro-fecha"
              autoComplete="off"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
            />
          </div>

          <div className="registroCampo">
            <label htmlFor="reg-genero">Género</label>
            <div className="registroSelectWrapper">
              <select
                id="reg-genero"
                className="registroInput"
                name="fanmeet-registro-genero"
                autoComplete="off"
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
              >
                <option value="" disabled>
                  Elegí una opción
                </option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
              <svg className="registroSelectFlecha" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          {errorRegistro && (
            <p className="fmAvisoError regError registroErrorFila" role="alert">
              {errorRegistro}
            </p>
          )}

          <button className="fmBotonPrimario regBotonSiguiente registroBotonFila" type="submit" disabled={cargando}>
            {cargando ? "Verificando…" : "Siguiente"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Registro1;