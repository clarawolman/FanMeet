import { exigirSinBloqueo } from "../services/bloqueoService.js";

// Para las rutas con :idUsuario (perfil, highlights, amigos, chat privado,
// compatibilidad...): si hay un bloqueo entre quien pide y ese usuario, en
// cualquier sentido, responde 404 como si no existiera. Va después de
// authMiddleware y de validar los params.
export async function sinBloqueo(req, _res, next) {
  try {
    await exigirSinBloqueo(req.user.id, req.params.idUsuario);
    next();
  } catch (error) {
    next(error);
  }
}
