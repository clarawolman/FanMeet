import { supabaseAuth } from "../config/supabaseClient.js";
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

  // RPC existente en el proyecto (Registro1.jsx la usa hoy desde el cliente).
  // Su implementacion vive en Postgres, fuera de este repo.
  async mailExisteEnAuth(mail) {
    return supabaseAuth.rpc("mail_existe_en_auth", { mail_input: mail });
  },
};
