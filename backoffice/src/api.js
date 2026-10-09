import { createClient } from "@supabase/supabase-js";

// supabase-js solo se usa para guardar la sesión y renovarla sola; el
// login y todos los datos pasan por el backend.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function solicitar(path, { method = "GET", body, autenticado = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (autenticado) {
    const { data } = await supabase.auth.getSession();
    if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : null;
  if (!respuesta.ok) {
    const detalle = datos?.details?.map?.((d) => d.mensaje).join(". ");
    const error = new Error(detalle || datos?.error || "Ocurrió un error");
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}

function conQuery(path, filtros = {}) {
  const params = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export const api = {
  async login(usuarioOMail, contrasena) {
    const resultado = await solicitar("/auth/login", {
      method: "POST",
      body: { usuarioOMail, contrasena },
      autenticado: false,
    });
    if (resultado.usuario.rol !== "moderador") {
      throw new Error("Esta cuenta no es de moderador.");
    }
    await supabase.auth.setSession({
      access_token: resultado.session.access_token,
      refresh_token: resultado.session.refresh_token,
    });
    return resultado.usuario;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  resumen: () => solicitar("/backoffice/resumen"),

  usuarios: (filtros) => solicitar(conQuery("/backoffice/usuarios", filtros)),
  usuario: (id) => solicitar(`/backoffice/usuarios/${id}`),
  cambiarEstado: (id, estado, motivo) =>
    solicitar(`/backoffice/usuarios/${id}/estado`, { method: "PATCH", body: { estado, motivo } }),

  reportes: (filtros) => solicitar(conQuery("/backoffice/reportes", filtros)),
  reporte: (id) => solicitar(`/backoffice/reportes/${id}`),
  resolverReporte: (id, decision, resolucion) =>
    solicitar(`/backoffice/reportes/${id}`, { method: "PATCH", body: { decision, resolucion } }),

  catalogo: () => solicitar("/backoffice/catalogo"),
  conciertos: () => solicitar("/backoffice/conciertos"),
  crearConcierto: (datos) => solicitar("/backoffice/conciertos", { method: "POST", body: datos }),
  editarConcierto: (id, cambios) =>
    solicitar(`/backoffice/conciertos/${id}`, { method: "PATCH", body: cambios }),
  publicarNovedad: (id, titulo, descripcion) =>
    solicitar(`/backoffice/conciertos/${id}/novedades`, {
      method: "POST",
      body: { titulo, descripcion },
    }),

  grupos: () => solicitar("/backoffice/grupos"),
  mensajesDeGrupo: (id) => solicitar(`/backoffice/grupos/${id}/mensajes`),
};
