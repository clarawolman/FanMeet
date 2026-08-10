import { verificarToken } from "../config/jwks.js";
import { ApiError } from "../helpers/ApiError.js";

// Fuente de verdad de identidad: nunca usar req.body.usuarioId / req.params.idUsuario
// para saber "quien" hace la accion. Siempre req.user.id, salido de un JWT
// de Supabase Auth verificado en el servidor (ver config/jwks.js).
export async function authMiddleware(req, _res, next) {
  const header = req.headers.authorization || "";
  const [tipo, token] = header.split(" ");

  if (tipo !== "Bearer" || !token) {
    return next(ApiError.unauthorized("Falta el token de autenticacion"));
  }

  try {
    const payload = await verificarToken(token);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(ApiError.unauthorized("Token invalido o expirado"));
  }
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

  try {
    const payload = await verificarToken(token);
    req.user = { id: payload.sub, email: payload.email };
  } catch {
    // token invalido en un endpoint opcional: seguimos como anonimo
  }
  return next();
}
