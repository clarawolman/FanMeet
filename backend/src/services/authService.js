import { authRepository } from "../repositories/authRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { toUsuarioCompleto } from "../entities/Usuario.js";
import { ApiError } from "../helpers/ApiError.js";
import { FOTO_PERFIL_DEFAULT } from "../helpers/constants.js";

function formatearSesion(session) {
  if (!session) return null;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };
}

export const authService = {
  // Replica exactamente el flujo de loginForm.jsx: si no viene "@" se
  // resuelve el mail por nombre de usuario antes de autenticar.
  async login({ usuarioOMail, contrasena }) {
    let mail = usuarioOMail.trim();

    if (!mail.includes("@")) {
      const fila = await usuarioRepository.obtenerMailPorNombre(mail);
      if (!fila) {
        throw ApiError.unauthorized("Este usuario no existe");
      }
      mail = fila.mail;
    }

    const { data, error } = await authRepository.signInWithPassword(mail, contrasena);
    if (error) {
      throw ApiError.unauthorized("Usuario/mail o contraseña incorrectos");
    }

    const usuario = await usuarioRepository.obtenerPorId(data.user.id);
    if (!usuario) {
      // Mismo caso borde que documenta App.jsx: cuenta de auth sin fila en "usuario".
      throw ApiError.unauthorized("Este usuario no existe");
    }

    return { usuario: toUsuarioCompleto(usuario), session: formatearSesion(data.session) };
  },

  // Replica exactamente App.jsx::manejarFinalizarRegistro: sin chequeos
  // previos de duplicados acá (esos ya los hizo Registro1.jsx en el paso 1
  // vía verificarDisponibilidadRegistro); el único filtro de duplicados en
  // el submit final es el propio error de signUp, igual que hoy.
  async registro(datos) {
    const { data, error } = await authRepository.signUp(datos.mail, datos.contrasena);
    if (error) {
      const yaRegistrado =
        error.code === "user_already_exists" ||
        error.message?.toLowerCase().includes("already registered");

      throw ApiError.badRequest(
        yaRegistrado
          ? "Ese mail ya tiene una cuenta. Iniciá sesión, o si la cuenta quedó sin perfil, pedile a quien administra Supabase que la elimine desde Authentication → Users."
          : `Error al crear usuario en Auth: ${error.message}`
      );
    }

    const usuarioCreado = await usuarioRepository.crear({
      id_usuario: data.user.id,
      nombre: datos.nombre,
      mail: datos.mail,
      fechanac: datos.fechanac,
      genero: datos.genero,
      fotoperfil: datos.previewFoto || FOTO_PERFIL_DEFAULT,
      estilo_asistencia: datos.estilo_asistencia,
    });

    if (datos.estilos_musicales?.length > 0) {
      await estiloMusicalRepository.reemplazarSeleccion(
        usuarioCreado.id_usuario,
        datos.estilos_musicales
      );
    }

    return { usuario: toUsuarioCompleto(usuarioCreado), session: formatearSesion(data.session) };
  },

  // Replica exactamente los 3 chequeos que hace Registro1.jsx antes de
  // avanzar al paso 2 (mismos mensajes), para que ese componente pueda
  // migrar a este endpoint sin cambiar su UX.
  async verificarDisponibilidadRegistro({ nombre, mail }) {
    const mailLimpio = mail.trim().toLowerCase();
    const nombreLimpio = nombre.trim();

    const usuarioConMail = await usuarioRepository.existeMail(mailLimpio);
    if (usuarioConMail) {
      return { disponible: false, mensaje: "Mail ya está registrado" };
    }

    const { data: mailEnAuth, error: errorMailAuth } = await authRepository.mailExisteEnAuth(
      mailLimpio
    );
    if (errorMailAuth) {
      throw ApiError.internal("Hubo un error al verificar el mail");
    }
    if (mailEnAuth) {
      return { disponible: false, mensaje: "E-mail ya registrado." };
    }

    const usuarioConNombre = await usuarioRepository.existeNombre(nombreLimpio);
    if (usuarioConNombre) {
      return { disponible: false, mensaje: "Nombre de usuario en uso" };
    }

    return { disponible: true };
  },

  // Los JWT de Supabase son stateless: no hay revocacion inmediata desde
  // el backend con la info disponible en este repo (NO DETERMINADO si el
  // proyecto Supabase tiene revocacion de refresh tokens habilitada).
  // El logout real hoy depende de que el cliente descarte el token.
  async logout() {
    return { ok: true };
  },
};
