import { supabase } from "../supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

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
    throw new Error("No se pudo conectar con el servidor");
  }

  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : null;

  if (!respuesta.ok) {
    const error = new Error(datos?.error || "Ocurrió un error");
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
