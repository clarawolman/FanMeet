import { verificarToken } from "../config/jwks.js";
import { usuarioRepository } from "../repositories/usuarioRepository.js";
import { ApiError } from "../helpers/ApiError.js";

export const CODIGO_CUENTA_SUSPENDIDA = "CUENTA_SUSPENDIDA";

export function errorCuentaSuspendida() {
  return new ApiError(403, "Tu cuenta está suspendida. Si creés que es un error, escribinos a fanmeet100@gmail.com.", {
    codigo: CODIGO_CUENTA_SUSPENDIDA,
  });
}

// Un JWT sigue siendo válido hasta que vence aunque la cuenta se haya
// suspendido, así que el estado se mira en la base en cada request: un
// usuario suspendido queda afuera de toda la API en su próxima acción.
async function cargarUsuario(payload) {
  const fila = await usuarioRepository.obtenerEstadoYRol(payload.sub);
  if (fila?.estado === "suspendido") throw errorCuentaSuspendida();
  return { id: payload.sub, email: payload.email, rol: fila?.rol || "usuario" };
}

// Fuente de verdad de identidad: nunca usar req.body.usuarioId / req.params.idUsuario
// para saber "quien" hace la accion. Siempre req.user.id, salido de un JWT
// de Supabase Auth verificado en el servidor (ver config/jwks.js).
export async function authMiddleware(req, _res, next) {
  const header = req.headers.authorization || "";
  const [tipo, token] = header.split(" ");

  if (tipo !== "Bearer" || !token) {
    return next(ApiError.unauthorized("Falta el token de autenticacion"));
  }

  let payload;
  try {
    payload = await verificarToken(token);
  } catch {
    return next(ApiError.unauthorized("Token invalido o expirado"));
  }

  try {
    req.user = await cargarUsuario(payload);
    return next();
  } catch (error) {
    return next(error);
  }
}

// Solo para las rutas del backoffice (va después de authMiddleware).
export function soloModerador(req, _res, next) {
  if (req.user?.rol !== "moderador") {
    return next(ApiError.forbidden("Solo los moderadores pueden entrar al backoffice"));
  }
  return next();
}

// Version opcional: si viene token lo valida y setea req.user, pero no
// rechaza la request si no viene (para endpoints publicos que cambian
// de comportamiento si el usuario esta identificado, ej. ver perfil ajeno).
export async function authOpcional(req, _res, next) {
  const header = req.headers.authorization || "";
  const [tipo, token] = header.split(" ");

  if (tipo !== "Bearer" || !token) {
    return next();
  }

  let payload;
  try {
    payload = await verificarToken(token);
  } catch {
    // token invalido en un endpoint opcional: seguimos como anonimo
    return next();
  }

  try {
    req.user = await cargarUsuario(payload);
    return next();
  } catch (error) {
    return next(error);
  }
}
