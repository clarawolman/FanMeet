import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporte = null;

function obtenerTransporte() {
  if (!env.gmailUsuario || !env.gmailContrasenaApp) return null;
  if (!transporte) {
    transporte = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.gmailUsuario, pass: env.gmailContrasenaApp },
    });
  }
  return transporte;
}

// Manda un mail desde el Gmail de FanMeet. Nunca rompe el flujo que lo
// llama: si el mail no está configurado o falla, lo deja en el log y
// devuelve false (el reporte igual queda guardado y se ve en el backoffice).
export async function enviarMail({ para, asunto, texto }) {
  const transporteActual = obtenerTransporte();
  if (!transporteActual || !para) {
    console.warn(`[mail no configurado] Para: ${para || "(nadie)"} | ${asunto}\n${texto}`);
    return false;
  }

  try {
    await transporteActual.sendMail({
      from: `FanMeet <${env.gmailUsuario}>`,
      to: para,
      subject: asunto,
      text: texto,
    });
    return true;
  } catch (error) {
    console.error("No se pudo mandar el mail:", error.message);
    return false;
  }
}
