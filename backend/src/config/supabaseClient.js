import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Cliente con service_role: unico punto del backend que puede saltarse RLS.
// Solo lo usan los repositories; la autorizacion real la hacen los services.
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Cliente con anon key: usado solo para las operaciones de auth (signIn/signUp/rpc)
// que deben correr con el mismo rol que hoy usa el frontend.
export const supabaseAuth = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
