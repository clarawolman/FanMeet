import { crearApp } from "./app.js";
import { env } from "./config/env.js";
import { programarRecordatorios } from "./services/recordatorioConciertos.js";

const app = crearApp();

app.listen(env.port, () => {
  console.log(`FanMeet backend escuchando en http://localhost:${env.port}`);

  // Recordatorio del día del show: necesita que el proceso quede vivo
  // (ver services/recordatorioConciertos.js).
  if (env.recordatoriosCadaMinutos > 0) {
    programarRecordatorios(env.recordatoriosCadaMinutos);
  }
});
