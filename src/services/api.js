import { supabase } from "../supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Lo que ve el usuario cuando algo falla de nuestro lado: nunca "Error
// interno del servidor" ni detalles técnicos. Los 503 sí traen un texto
// pensado para mostrar ("Last.fm está limitando las consultas...").
const MENSAJE_ERROR_GENERICO = "Algo salió mal. Probá de nuevo en un rato.";
const MENSAJE_SIN_CONEXION = "No pudimos conectarnos. Revisá tu conexión y probá de nuevo.";

// Mientras la migración es progresiva, la sesión "de verdad" sigue siendo
// la que mantiene supabase-js (persistida en localStorage) porque las
// pantallas que todavía no migraron siguen llamando a Supabase directo con
// ese mismo cliente. Para hablarle al backend, reusamos ese access_token.
async function obtenerToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function solicitar(path, { method = "GET", body, formData, autenticado = true } = {}) {
  const headers = {};

  // Si es FormData (subida de archivos) NO seteamos Content-Type: el
  // navegador tiene que agregar el boundary del multipart automáticamente.
  if (!formData) {
    headers["Content-Type"] = "application/json";
  }

  if (autenticado) {
    const token = await obtenerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new Error(MENSAJE_SIN_CONEXION);
  }

  const texto = await respuesta.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    // Respuesta que no es JSON (proxy caído, página de error): se trata
    // como error genérico más abajo.
  }

  if (!respuesta.ok) {
    const mostrarMensaje = respuesta.status < 500 || respuesta.status === 503;
    const error = new Error((mostrarMensaje && datos?.error) || MENSAJE_ERROR_GENERICO);
    error.status = respuesta.status;
    error.details = datos?.details;
    throw error;
  }

  return datos;
}

export const api = {
  get: (path, opciones) => solicitar(path, { ...opciones, method: "GET" }),
  post: (path, body, opciones) => solicitar(path, { ...opciones, method: "POST", body }),
  put: (path, body, opciones) => solicitar(path, { ...opciones, method: "PUT", body }),
  patch: (path, body, opciones) => solicitar(path, { ...opciones, method: "PATCH", body }),
  del: (path, opciones) => solicitar(path, { ...opciones, method: "DELETE" }),
  postForm: (path, formData, opciones) =>
    solicitar(path, { ...opciones, method: "POST", formData }),
};
