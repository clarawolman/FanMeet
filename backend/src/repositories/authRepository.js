import { supabaseAdmin, supabaseAuth } from "../config/supabaseClient.js";
import { env } from "../config/env.js";

// Estas llamadas corren con la anon key (mismo rol que usa hoy el frontend)
// porque son las que hablan directamente con Supabase Auth (GoTrue).
export const authRepository = {
  async signInWithPassword(email, password) {
    return supabaseAuth.auth.signInWithPassword({ email, password });
  },

  // El link del mail de confirmación vuelve a la app de fans.
  async signUp(email, password) {
    return supabaseAuth.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: env.frontendUrl },
    });
  },

  // Con "Confirm email" activado en Supabase, signUp no devuelve sesión:
  // la cuenta queda pendiente hasta que se verifica el código del mail.
  async verificarCodigoRegistro(email, token) {
    return supabaseAuth.auth.verifyOtp({ email, token, type: "signup" });
  },

  async reenviarCodigoRegistro(email) {
    return supabaseAuth.auth.resend({ type: "signup", email });
  },

  // Configuración de la cuenta: con service_role, después de que el service
  // confirmó la contraseña actual.
  async actualizarCuenta(idUsuario, cambios) {
    return supabaseAdmin.auth.admin.updateUserById(idUsuario, cambios);
  },

  async eliminarCuenta(idUsuario) {
    return supabaseAdmin.auth.admin.deleteUser(idUsuario);
  },

  // RPC existente en el proyecto (Registro1.jsx la usa hoy desde el cliente).
  // Su implementacion vive en Postgres, fuera de este repo.
  async mailExisteEnAuth(mail) {
    return supabaseAuth.rpc("mail_existe_en_auth", { mail_input: mail });
  },
};
