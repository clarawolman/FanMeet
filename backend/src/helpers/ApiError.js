export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "No autenticado") {
    return new ApiError(401, message);
  }

  static forbidden(message = "No autorizado") {
    return new ApiError(403, message);
  }

  static notFound(message = "Recurso no encontrado") {
    return new ApiError(404, message);
  }

  static unprocessable(message, details) {
    return new ApiError(422, message, details);
  }

  static internal(message = "Error interno") {
    return new ApiError(500, message);
  }
}
