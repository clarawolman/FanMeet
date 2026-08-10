import { crearApp } from "./app.js";
import { env } from "./config/env.js";

const app = crearApp();

app.listen(env.port, () => {
  console.log(`FanMeet backend escuchando en http://localhost:${env.port}`);
});
