import { authRepository } from "../repositories/authRepository.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { estiloMusicalRepository } from "../repositories/estiloMusicalRepository.js";
import { toUsuarioCompleto } from "../entities/Usuario.js";
import { ApiError } from "../helpers/ApiError.js";
import { FOTO_PERFIL_DEFAULT } from "../helpers/constants.js";
import { errorCuentaSuspendida } from "../middlewares/authMiddleware.js";

function formatearSesion(session) {
  if (!session) return null;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };
}

// Lo que hace falta para crear el perfil. Se guarda en la cuenta de Auth
// hasta que se confirma el mail; nunca lleva la contraseña.
function datosDelPerfil(datos) {
  return {
    nombre: datos.nombre,
    apodo: datos.apodo || null,
    mail: datos.mail,
    fechanac: datos.fechanac,
    genero: datos.genero,
    // Solo URLs públicas: una URL blob: o una ruta local del frontend no
    // se puede ver desde otro navegador. La foto real se sube aparte.
    fotoperfil: /^https?:\/\//i.test(datos.previewFoto || "") ? datos.previewFoto : FOTO_PERFIL_DEFAULT,
    estilo_asistencia: datos.estilo_asistencia || null,
    estilos_musicales: datos.estilos_musicales || [],
  };
}

async function crearPerfil(idUsuario, { estilos_musicales, ...perfil }) {
  const usuarioCreado = await usuarioRepository.crear({ id_usuario: idUsuario, ...perfil });

  if (estilos_musicales?.length > 0) {
    await estiloMusicalRepository.reemplazarSeleccion(usuarioCreado.id_usuario, estilos_musicales);
  }

  return usuarioCreado;
}

// El perfil se crea recién con el mail confirmado: antes de eso nadie puede
// ver la cuenta. Corre al verificar el código y también al iniciar sesión,
// por si se confirmó con el link del mail o falló algo después de usar el
// código (que ya no sirve para reintentar).
async function obtenerOCrearPerfil(usuarioAuth) {
  const usuario = await usuarioRepository.obtenerPorId(usuarioAuth.id);
  if (usuario) return usuario;

  const pendiente = usuarioAuth.user_metadata?.registro_pendiente;
  if (!pendiente) return null;

  // El nombre se chequeó en el paso 1, pero mientras tanto otra persona pudo
  // haber confirmado primero con el mismo. El código ya se usó: no se puede
  // frenar acá, y el @nombre se puede cambiar desde el perfil.
  const nombreOcupado = await usuarioRepository.existeNombre(pendiente.nombre);

  return crearPerfil(usuarioAuth.id, {
    ...pendiente,
    nombre: nombreOcupado ? `${pendiente.nombre}${usuarioAuth.id.slice(0, 4)}` : pendiente.nombre,
  });
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
    if (error?.code === "email_not_confirmed") {
      // Solo llega acá con la contraseña correcta: Supabase valida las
      // credenciales antes de chequear la confirmación. El frontend usa
      // details.codigo para llevarlo a la pantalla de verificación.
      throw ApiError.forbidden("Tenés que confirmar tu mail antes de ingresar", {
        codigo: "mail_no_confirmado",
        mail,
      });
    }
    if (error) {
      throw ApiError.unauthorized("Usuario/mail o contraseña incorrectos");
    }

    const usuario = await obtenerOCrearPerfil(data.user);
    if (!usuario) {
      // Mismo caso borde que documenta App.jsx: cuenta de auth sin fila en "usuario".
      throw ApiError.unauthorized("Este usuario no existe");
    }
    if (usuario.estado === "suspendido") {
      throw errorCuentaSuspendida();
    }

    return { usuario: toUsuarioCompleto(usuario), session: formatearSesion(data.session) };
  },

  // Replica exactamente App.jsx::manejarFinalizarRegistro: sin chequeos
  // previos de duplicados acá (esos ya los hizo Registro1.jsx en el paso 1
  // vía verificarDisponibilidadRegistro); el único filtro de duplicados en
  // el submit final es el propio error de signUp, igual que hoy.
  async registro(datos) {
    const perfil = datosDelPerfil(datos);
    const { data, error } = await authRepository.signUp(datos.mail, datos.contrasena, {
      registro_pendiente: perfil,
    });

    // Con la confirmación de mail activa, Supabase no da error si el mail ya
    // está confirmado: devuelve un usuario falso, sin identidades.
    const yaRegistrado =
      error?.code === "user_already_exists" ||
      error?.message?.toLowerCase().includes("already registered") ||
      data?.user?.identities?.length === 0;

    if (yaRegistrado) {
      throw ApiError.badRequest(
        "Ese mail ya tiene una cuenta. Iniciá sesión, o si la cuenta quedó sin perfil, pedile a quien administra Supabase que la elimine desde Authentication → Users."
      );
    }
    if (error) {
      throw ApiError.badRequest(`Error al crear usuario en Auth: ${error.message}`);
    }

    // Sin sesión = Supabase exige confirmar el mail: todavía no hay perfil y
    // el frontend pide el código antes de seguir.
    if (!data.session) {
      return { usuario: null, session: null, requiereConfirmacion: true };
    }

    const usuarioCreado = await crearPerfil(data.user.id, perfil);

    return {
      usuario: toUsuarioCompleto(usuarioCreado),
      session: formatearSesion(data.session),
      requiereConfirmacion: false,
    };
  },

  async verificarCodigo({ mail, codigo }) {
    const { data, error } = await authRepository.verificarCodigoRegistro(
      mail.trim().toLowerCase(),
      codigo.trim()
    );
    if (error || !data?.session) {
      throw ApiError.badRequest("El código es incorrecto o ya venció. Pedí uno nuevo.");
    }

    const usuario = await obtenerOCrearPerfil(data.user);
    if (!usuario) {
      throw ApiError.unauthorized("Este usuario no existe");
    }

    return { usuario: toUsuarioCompleto(usuario), session: formatearSesion(data.session) };
  },

  async reenviarCodigo({ mail }) {
    const { error } = await authRepository.reenviarCodigoRegistro(mail.trim().toLowerCase());
    if (error) {
      const esperar = error.status === 429 || error.code === "over_email_send_rate_limit";
      throw esperar
        ? new ApiError(429, "Esperá un minuto antes de pedir otro código")
        : ApiError.internal(`No se pudo reenviar el código: ${error.message}`);
    }
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
