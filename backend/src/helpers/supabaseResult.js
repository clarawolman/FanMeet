import { ApiError } from "./ApiError.js";

// Traduce el patron {data, error} de supabase-js a algo que los services
// puedan usar sin repetir "if (error) ..." en cada query.
export function unwrap({ data, error }, mensajeError) {
  if (error) {
    throw ApiError.internal(`${mensajeError}: ${error.message}`);
  }
  return data;
}
