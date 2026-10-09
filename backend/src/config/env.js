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

  // URL de la app de fans: a dónde vuelve el link de "confirmá tu mail".
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  // URL del backoffice: se usa en el mail que avisa de un reporte nuevo.
  backofficeUrl: process.env.BACKOFFICE_URL || "http://localhost:5175",

  // Gmail de FanMeet para mandar mails (opcionales: si faltan, el backend
  // arranca igual y los mails solo se loguean en consola).
  gmailUsuario: process.env.GMAIL_USUARIO || "",
  gmailContrasenaApp: process.env.GMAIL_CONTRASENA_APP || "",
  mailModerador: process.env.MAIL_MODERADOR || process.env.GMAIL_USUARIO || "",

  // Una novedad de un concierto solo se notifica si tiene al menos esta
  // cantidad de fans unidos.
  minimoUnidosParaNotificar: Number(process.env.MINIMO_UNIDOS_PARA_NOTIFICAR) || 10,
};
