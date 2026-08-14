// Evita el try/catch repetido en cada controller: reenvia cualquier error
// (de service o repository) al middleware centralizado de errores.
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
