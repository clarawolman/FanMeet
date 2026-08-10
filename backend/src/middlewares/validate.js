import { ApiError } from "../helpers/ApiError.js";

// Vuelve a validar en el servidor lo que React ya valida en el formulario
// (nunca confiar solo en la validacion del frontend).
export function validate(schema, fuente = "body") {
  return function validarMiddleware(req, _res, next) {
    const resultado = schema.safeParse(req[fuente]);

    if (!resultado.success) {
      const detalles = resultado.error.issues.map((issue) => ({
        campo: issue.path.join("."),
        mensaje: issue.message,
      }));
      return next(ApiError.unprocessable("Datos invalidos", detalles));
    }

    req[fuente] = resultado.data;
    return next();
  };
}
