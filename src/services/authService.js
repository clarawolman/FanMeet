import { api } from "./api";
import { supabase } from "../supabase";

// Después de login/registro exitosos, le pasamos la sesión que devolvió el
// backend al cliente de supabase-js local. Es necesario mientras dure la
// migración progresiva: todas las pantallas que todavía no migraron siguen
// llamando a Supabase directo usando la sesión de ESTE mismo cliente.
async function aplicarSesion(session) {
  if (!session) return;
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) {
    console.error("Error aplicando sesión:", error);
  }
}

export const authService = {
  async login(usuarioOMail, contrasena) {
    const resultado = await api.post(
      "/auth/login",
      { usuarioOMail, contrasena },
      { autenticado: false }
    );
    await aplicarSesion(resultado.session);
    return resultado.usuario;
  },

  async verificarDisponibilidadRegistro(nombre, mail) {
    return api.post("/auth/verificar-registro", { nombre, mail }, { autenticado: false });
  },

  async registro(datosRegistro) {
    const resultado = await api.post("/auth/registro", datosRegistro, { autenticado: false });
    await aplicarSesion(resultado.session);
    return resultado.usuario;
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Error notificando logout al backend:", error);
    }
    await supabase.auth.signOut();
  },
};
