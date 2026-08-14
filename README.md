Terminal 1 — Backend

cd C:\Users\48860067\FanMeet\backend
set NODE_TLS_REJECT_UNAUTHORIZED=0
npm run dev
Tiene que quedar mostrando:


FanMeet backend escuchando en http://localhost:4000
Dejá esta terminal abierta y sin tocar.

(El set NODE_TLS_REJECT_UNAUTHORIZED=0 es el que estamos usando para diagnosticar el problema de certificados de esta compu — hay que ponerlo cada vez que abrís una terminal nueva para el backend, porque es una variable temporal que no queda guardada. Una vez que confirmemos que esto soluciona el problema, vemos un fix definitivo que no dependa de escribir esto cada vez.)

Terminal 2 — Frontend

cd C:\Users\48860067\FanMeet
npm run dev
Tiene que quedar mostrando algo como:


➜  Local:   http://localhost:5173/
Dejá esta terminal también abierta y sin tocar.

Después
Abrí http://localhost:5173 en el navegador y usá la app ahí. Mientras las dos terminales sigan abiertas y mostrando esos mensajes, podés seguir probando. Pegame lo que aparece en la terminal del backend cuando intentes registrarte o loguearte.
