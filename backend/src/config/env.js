import "dotenv/config";

function requerido(nombre) {
  const valor = process.env[nombre];
  if (!valor && process.env.NODE_ENV !== "test") {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa backend/.env (ver .env.example).`);
  }
  return valor;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  supabaseUrl: requerido("SUPABASE_URL"),
  supabaseServiceRoleKey: requerido("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseAnonKey: requerido("SUPABASE_ANON_KEY"),
  conciertoAccessCode: requerido("CONCIERTO_ACCESS_CODE"),
  // Last.fm y Spotify son opcionales: si faltan, el backend arranca igual y
  // solo sus endpoints responden 503.
  lastfmApiKey: process.env.LASTFM_API_KEY || "",
  // Spotify se usa solo con el token de la app (busqueda de artistas y
  // fotos), nunca con login de usuarios.
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || "",
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
};
