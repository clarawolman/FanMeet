# Prompt para seguir con las mejoras de FanMeet

Copiá todo lo que está debajo de la línea y pegalo en un chat nuevo de Claude Code abierto en la carpeta del proyecto.

---

Vamos a seguir con las mejoras de FanMeet. Todo se hace en la branch **`mejoras`**, nunca en `main`.

## Reglas de trabajo (importantes)

1. Antes de tocar nada: `git switch mejoras` y `git pull`. Confirmá con `git status` que estás en `mejoras` y que no hay cambios sin commitear.
2. Hacé **una mejora por vez**, en el orden de la lista. Al terminar cada una, explicame qué hiciste y cómo probarla, y **esperá mi "sí"** antes de seguir.
3. Cuando apruebo una mejora, hacé **un commit** con un mensaje en español que diga qué cambió. No hagas push ni merge salvo que te lo pida.
4. Si una mejora necesita cambios en la base, escribí un archivo `supabase/<nombre>.sql` para que lo corra yo en el SQL Editor de Supabase. No modifiques la base vos.
5. Respondeme en español rioplatense.

## Lo que ya está hecho en `mejoras`

| # | Mejora | Commit |
|---|---|---|
| 1 | Orden alfabético de las opciones en los formularios del backoffice | `a76a8e0` |
| 2 | El creador puede editar su grupo desde la app | `a2dd7db` |
| 3 | Notificación `cambio_grupo` a los integrantes cuando cambia un grupo | `17ee7ec` |
| — | Arreglo: las notificaciones no se podían tocar (`transform` en `:active`), imagen `blob:`, `key` del carrusel, foto del hero del grupo | `591a745` |
| 4 | Cupo de los grupos: limitado (2 a 500) o ilimitado | `971d69f` |

## Mejoras que faltan (en este orden)

### 5. Recordatorio el día del show
- El día del concierto (hora de Argentina), mandarles una notificación a los fans unidos al concierto: "Hoy es <show>, a las <hora> en <estadio>".
- A quien además está en un grupo de ese concierto, sumarle los datos del grupo (hora y punto de encuentro).
- No puede mandarse dos veces el mismo recordatorio. Guardá registro de lo enviado o chequeá si ya existe la notificación de ese tipo para ese usuario y concierto ese día.
- El backend es un servidor Express persistente (`npm run dev` → `node --watch src/server.js`). Proponé cómo dispararlo (por ejemplo, un chequeo periódico al arrancar el server) y explicá qué pasa si el backend se despliega en un lugar sin proceso persistente.
- Tipo nuevo de notificación (`recordatorio_concierto`): hay que actualizar el `check` de `notificacion.tipo`. **Antes de escribir el SQL, consultá en la base qué tipos existen hoy.** En la base hay tipos que no figuran en los SQL del repo, como `momento_etiquetado`. Lista conocida: `concierto_unido`, `grupo_unido`, `solicitud_amistad`, `amistad_aceptada`, `mensaje_grupo`, `mensaje_privado`, `novedad_concierto`, `momento_etiquetado`, `cambio_grupo`.
- Tocar la notificación tiene que abrir el concierto (ver `manejarVerMasNotificacion` en `src/App.jsx`).

### 6. Bloquear usuarios
- Tabla nueva de bloqueos (quién bloqueó a quién).
- Efectos en los dos sentidos:
  - el bloqueado no te puede buscar y vos tampoco lo ves (Descubrir, búsqueda, fans unidos, perfil público, sugerencias);
  - se elimina la amistad si existía;
  - no se pueden mandar mensajes privados en ningún sentido.
- Cuando alguien reporta a un usuario, la app le ofrece también bloquearlo.
- Tiene que haber forma de desbloquear (por ejemplo, desde el perfil del bloqueado o desde Configuración).
- Preguntame antes qué hacer con los grupos y chats de grupo que comparten.
- Validá todo en el backend, no solo ocultándolo en la app. El patrón a seguir es cómo se ocultan los usuarios suspendidos (commit "Ocultar usuarios suspendidos en la app de fans").

### 7. Consejos de seguridad al unirse a un grupo
- Antes de confirmar la asistencia a un grupo, mostrar consejos breves: encontrarse en lugares públicos, avisarle a alguien de confianza, no compartir datos personales, reportar y bloquear si algo no está bien.
- Que no moleste en cada grupo: por ejemplo, que se pueda marcar "no mostrar de nuevo" (alcanza con `localStorage`).

### 8. Fotos en los chats de grupo, con cuidados
- Los **chats privados ya mandan fotos**: miralo y reusá eso.
  - Backend: `backend/src/routes/chatRoutes.js` (`upload.single("imagen")`) y `chatService.js` (`esImagenValida` de `helpers/validarImagen.js`, que valida la firma real del archivo, y `storageRepository.subirArchivo`).
  - App: `src/componentes/chats/Chats.jsx` (tipos jpg, png y webp, máximo 5 MB).
- Cuidados:
  - solo pueden mandar los integrantes del grupo;
  - solo jpg, png o webp, validados por contenido y no solo por extensión;
  - límite de tamaño;
  - pocas fotos por minuto (hay un rate limiter en `middlewares/rateLimiter.js`);
  - las fotos se pueden reportar como los mensajes;
  - el moderador las ve en el backoffice cuando revisa un reporte o el chat del grupo.

### 9. Eliminar grupos desde el backoffice
- Botón "Eliminar" en Grupos, con una confirmación que diga cuántos integrantes y mensajes tiene.
- Borra el grupo con sus integrantes y mensajes, y les manda una notificación a los integrantes.
- El patrón a seguir es "Eliminar concierto" en `backoffice/src/paginas/Conciertos.jsx` y `backofficeService.eliminarConcierto`.

### 10. Importar conciertos en lote desde el backoffice
- Pegar una lista (CSV o una tabla copiada) con: nombre, artista, estadio, género, fecha y hora, imagen.
- Mostrar una vista previa antes de crear, con los errores marcados por fila: estadio o género inexistente, fecha pasada, imagen inválida, concierto duplicado.
- Crear solo las filas válidas, avisar a los seguidores de cada artista como hace `crearConcierto`, y mostrar un resumen.
- Los estadios y géneros **no** se crean desde el backoffice: tienen que existir en la base. Los cargo yo por SQL.
- Hay un ejemplo de lista en `supabase/conciertos_timeout.md`.

### 11. Que Fani (el chatbot) pueda hacer acciones
- Hoy Fani solo responde con los datos que recibe: `backend/src/services/chatbotService.js`, que usa Gemini.
- Sumar *function calling* de Gemini para cosas como:
  - buscar grupos con lugar en mis conciertos;
  - contarme mis grupos y próximos eventos;
  - unirme a un grupo, **siempre pidiéndome confirmación antes**.
- Tiene que respetar las reglas de privacidad que ya tiene el prompt: solo grupos de conciertos a los que estoy unido, nunca datos de otros usuarios, nunca códigos de acceso. Las acciones tienen que reusar los services existentes (por ejemplo `grupoService.unirse`), que ya validan permisos y cupo.

## Datos técnicos del proyecto (para no perder tiempo)

- **Estructura:** app de fans en `src/` (Vite, puerto 5173), backend Express en `backend/` (puerto 4000) y backoffice en `backoffice/` (Vite, puerto 5175). `npm run dev` en la raíz levanta los tres.
- **Verificar antes de dar por terminada una mejora:**
  - `npx vitest run` en `backend/`, y sumar tests para lo nuevo;
  - `npx vite build` en la raíz y/o en `backoffice/`;
  - `npx eslint <archivos que cambiaste>`. Hay errores de lint viejos en `backoffice/src/componentes.jsx` y en el `useEffect` de `src/componentes/infoGrupos/infoGrupo.jsx`, que no hay que tocar.
- **Vite y archivos vacíos:** si reescribís un archivo entero con un script, Vite puede leerlo justo cuando está vacío y quedarse con esa versión. El navegador muestra "does not provide an export named 'default'". Al terminar, hacé `touch` de los archivos editados y verificá con `curl http://localhost:5173/src/<archivo>`. No uses `git stash` mientras corre el dev server.
- **Saltos de línea:** muchos archivos tienen CRLF. Respetá el formato que ya tiene cada archivo.
- **Red de la oficina:** pasa por un proxy Fortinet.
  - Para correr scripts de Node contra Supabase o Gemini: `NODE_EXTRA_CA_CERTS=./certs/fortinet-ca.pem node -r dotenv/config <script>`, ejecutado desde `backend/`.
  - Para `curl`, agregá `--ssl-no-revoke`.
- **CSS global:** `src/App.css` achica todos los botones en `:active` con `transform`. Si un botón usa un `::after` estirado para cubrir una tarjeta entera, ponele `transform: none` en `:active`, si no el clic no llega (ver `CardNotificacion.css`).
- **Probar la interfaz sin loguearse:** se puede armar una página HTML temporal en la raíz que monte un componente con datos simulados y abrirla con Edge en modo headless con `--remote-debugging-port`, manejándolo por CDP desde Node. Borrala al terminar.
- **Notificaciones:** se crean con `notificacionRepository.crear` o `crearVarias`. Al tocarlas, la app las maneja en `manejarVerMasNotificacion`, en `src/App.jsx`.

Empezá por la **mejora 5**. Primero leé el código relevante, contame en pocas líneas cómo la vas a hacer y arrancá.
