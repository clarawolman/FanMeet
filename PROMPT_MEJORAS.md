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
| 5 | Recordatorio el día del show (`recordatorio_concierto`, desde las 9 de Argentina, chequeo cada 15 min en `server.js`, tabla `recordatorio_concierto` para no repetir) | `e8089e7` |
| — | Backoffice: la página scrollea hasta el formulario o panel que se abre (hook `useMostrarAlAbrir`) | `1ee11c5` |
| 6 | Bloquear usuarios (tabla `bloqueo`, middleware `sinBloqueo` en las rutas con `:idUsuario`, filtro `sinBloqueados` en las listas; los grupos compartidos no cambian) | `8ef6c11` |
| 7 | Consejos de seguridad antes de unirse a un grupo (`ModalConsejosSeguridad`, "no volver a mostrar" en `localStorage`) | `c723e5f` |
| 8 | Fotos en los chats de grupo (columna `mensaje_grupo.imagen`, helper `services/fotosChat.js`, `fotosChatRateLimiter`: 5 fotos por minuto) | `a1a570c` |

Los SQL de estas mejoras (`recordatorio_concierto.sql`, `bloqueos.sql`, `fotos_chat_grupo.sql`) ya están corridos en la base.

## Mejoras que faltan (en este orden)

### 9. Eliminar grupos desde el backoffice
- Botón "Eliminar" en Grupos, con una confirmación que diga cuántos integrantes y mensajes tiene.
- Borra el grupo con sus integrantes y mensajes, y les manda una notificación a los integrantes.
- Los mensajes ahora pueden tener fotos (bucket `chats`, carpeta `grupos/<id_grupo>/`): decidí con la usuaria si se borran también del Storage.
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
  - unirme a un grupo, **siempre pidiéndome confirmación antes**. Al confirmar, que Fani también recuerde los consejos de seguridad de la mejora 7.
- Tiene que respetar las reglas de privacidad que ya tiene el prompt: solo grupos de conciertos a los que estoy unido, nunca datos de otros usuarios, nunca códigos de acceso. Las acciones tienen que reusar los services existentes (por ejemplo `grupoService.unirse`), que ya validan permisos y cupo. Tampoco tiene que mostrar a usuarios con los que hay un bloqueo (`sinBloqueados` en `services/bloqueoService.js`).

## Datos técnicos del proyecto (para no perder tiempo)

- **Estructura:** app de fans en `src/` (Vite, puerto 5173), backend Express en `backend/` (puerto 4000) y backoffice en `backoffice/` (Vite, puerto 5175). `npm run dev` en la raíz levanta los tres.
- **Dependencias:** puede que no estén instalados los `node_modules`. Si falta alguno, corré `npm ci` en la carpeta que corresponda (raíz, `backend/` o `backoffice/`).
- **El backend nuevo depende del SQL:** si una mejora agrega columnas o tablas, avisá bien claro que hay que correr el SQL **antes** de probar. Si no, el backend responde 500 (pasó con `bloqueos.sql` y `fotos_chat_grupo.sql`). Para confirmar que se corrió, consultá la tabla por REST con `curl`.
- **Verificar antes de dar por terminada una mejora:**
  - `npx vitest run` en `backend/`, y sumar tests para lo nuevo;
  - `npx vite build` en la raíz y/o en `backoffice/`;
  - `npx eslint <archivos que cambiaste>`. Hay errores de lint viejos que no hay que tocar: en `backoffice/src/componentes.jsx`, 3 en `src/componentes/chats/Chats.jsx` ("Cannot access variable before it is declared") y avisos de `useEffect` en `infoGrupo.jsx` y `perfil.jsx`.
- **Vite y archivos vacíos:** si reescribís un archivo entero con un script, Vite puede leerlo justo cuando está vacío y quedarse con esa versión. El navegador muestra "does not provide an export named 'default'". Al terminar, hacé `touch` de los archivos editados y verificá con `curl http://localhost:5173/src/<archivo>`. No uses `git stash` mientras corre el dev server.
- **Saltos de línea:** muchos archivos tienen CRLF, y algunos mezclan CRLF y LF. Respetá el formato que ya tiene cada archivo. Si editás con Python en Windows, abrí los archivos con `encoding="utf-8"` y `newline=""` (por defecto usa cp1252).
- **Mocks en los tests:** los tests de services que listan usuarios mockean `repositories/bloqueoRepository.js`. Si un service nuevo usa `sinBloqueados` o `exigirSinBloqueo`, su test tiene que mockearlo; si no, intenta conectarse a la base real y se cuelga.
- **Red de la oficina:** pasa por un proxy Fortinet.
  - Para correr scripts de Node contra Supabase o Gemini: `NODE_EXTRA_CA_CERTS=./certs/fortinet-ca.pem node --env-file=.env <script>`, ejecutado desde `backend/`. Para leer datos sin instalar nada, usá `fetch` contra `${SUPABASE_URL}/rest/v1/<tabla>`. Solo lecturas: no escribas en la base.
  - Para `curl`, agregá `--ssl-no-revoke`.
- **CSS global:** `src/App.css` achica todos los botones en `:active` con `transform`. Si un botón usa un `::after` estirado para cubrir una tarjeta entera, ponele `transform: none` en `:active`, si no el clic no llega (ver `CardNotificacion.css`).
- **Probar la interfaz sin loguearse:** se puede armar una página HTML temporal en la raíz que monte un componente con datos simulados y abrirla con Edge en modo headless con `--remote-debugging-port`, manejándolo por CDP desde Node. Usá `Emulation.setDeviceMetricsOverride` para el ancho: con `--window-size` la captura sale recortada. Usá un puerto distinto en cada corrida, porque el Edge anterior puede seguir ocupando el puerto. Borrá la página al terminar.
- **Notificaciones:** se crean con `notificacionRepository.crear` o `crearVarias`. Al tocarlas, la app las maneja en `manejarVerMasNotificacion`, en `src/App.jsx`.

Empezá por la **mejora 9**. Primero leé el código relevante, contame en pocas líneas cómo la vas a hacer y arrancá.
