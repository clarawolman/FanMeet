import { crearApp } from "./app.js";
import { env } from "./config/env.js";
import { programarRecordatorios } from "./services/recordatorioConciertos.js";
import { matchingService } from "./services/matchingService.js";

const SEIS_HORAS = 6 * 60 * 60 * 1000;

// Descubrir y "Para vos" dependen de Last.fm: se llena su cache de fondo al
// arrancar y cada 6 horas (lo que dura el top de cada usuario).
function precalentarMatching() {
  matchingService.precalentar().catch((error) => console.error("Precalentando el matching:", error.message));
}

const app = crearApp();

app.listen(env.port, () => {
  console.log(`FanMeet backend escuchando en http://localhost:${env.port}`);

  // Recordatorio del día del show: necesita que el proceso quede vivo
  // (ver services/recordatorioConciertos.js).
  if (env.recordatoriosCadaMinutos > 0) {
    programarRecordatorios(env.recordatoriosCadaMinutos);
  }

  precalentarMatching();
  setInterval(precalentarMatching, SEIS_HORAS).unref();
});
