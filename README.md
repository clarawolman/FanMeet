# FanMeet

Red social para conocer gente que va a los mismos recitales. Los fans se unen a un concierto, arman o se suman a grupos (previa, viaje, encuentro en el estadio, post show), chatean y comparten fotos del show.

**App:** https://fanmeet-lilac.vercel.app/ 

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitectura](#arquitectura)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos](#base-de-datos)
- [Scripts](#scripts)
- [Tests](#tests)
- [Deploy](#deploy)
- [API](#api)
- [Decisiones técnicas](#decisiones-técnicas)
- [Equipo](#equipo)

## Funcionalidades

### App de fans

| Módulo | Descripción |
|---|---|
| Registro e inicio de sesión | Registro en 5 pasos con confirmación por mail. |
| Home | Conciertos próximos, recomendaciones ("Para vos") y carpetas que agrupan las fechas de un mismo artista en el mismo estadio. |
| Conciertos | Detalle del show, fans unidos y grupos por categoría. Para unirse se pide un código de acceso, que se valida en el servidor. |
| Grupos | Creación y edición, confirmación de asistencia y chat grupal. Hay grupos de una fecha, grupos generales (todas las fechas seguidas de un artista) y comunidades sin encuentro. |
| Chats privados | Mensajes entre amigos, con fotos y momentos compartidos. |
| Amistades y bloqueos | Solicitudes de amistad. Un bloqueo oculta a la otra persona en grupos, búsquedas y chats. |
| Perfil | Foto, apodo, @usuario (se puede cambiar cada 15 días), descripción, artistas favoritos, géneros y lo que escucha en Last.fm. |
| Momentos | Publicaciones de hasta 10 fotos asociadas a un concierto, con etiquetas a amigos, me gusta, comentarios con respuestas, guardados y hasta 3 fijados en el perfil. |
| Descubrir | Fans ordenados por compatibilidad musical. |
| Notificaciones | Avisos de amistades, grupos, momentos, cambios en un concierto y recordatorio el día del show. |
| Fani (chatbot) | Asistente que busca conciertos y grupos y los muestra como tarjetas. Nunca ejecuta acciones por su cuenta ni ve datos de otros usuarios. |
| Configuración | Cuenta, privacidad, notificaciones, música y modo claro/oscuro. |

### Backoffice (moderadores)

- Panel de resumen.
- Reportes con la conversación donde ocurrió cada uno.
- Usuarios: detalle, suspensión y reactivación.
- Grupos y grupos automáticos.
- Alta, edición e importación masiva de conciertos y grupos.
- Envío de novedades a los fans de un concierto.

### Moderación

- Un usuario suspendido no puede iniciar sesión ni usar la API, y su mail no se puede volver a registrar.
- Los mensajes, nombres de grupo y comentarios pasan por un filtro de malas palabras (`backend/src/helpers/filtroPalabras.js`).
- Las novedades de un concierto solo se notifican si tiene al menos `MINIMO_UNIDOS_PARA_NOTIFICAR` fans unidos (10 por defecto).
- Hay rate limiting en el login, el chatbot, los reportes y la subida de fotos.

## Stack

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, Vite 8, CSS propio (sin frameworks) |
| Backoffice | React 19, Vite 8 |
| Backend | Node.js 18+, Express 4, Zod, Helmet, express-rate-limit, Multer, Nodemailer, jose |
| Base de datos, auth y archivos | Supabase (PostgreSQL, Auth, Storage) |
| Servicios externos | Groq (chatbot), Last.fm, Spotify Web API, MusicBrainz |
| Tests | Vitest, Supertest |
| Infraestructura | Vercel (frontend y backoffice), Render (backend), GitHub Actions |

## Arquitectura

```
┌──────────────┐   ┌──────────────┐
│  App de fans │   │  Backoffice  │      Vercel
└──────┬───────┘   └──────┬───────┘
       │   REST /api      │
       └────────┬─────────┘
         ┌──────▼───────┐
         │   Backend    │                Render
         │   Express    │──► Groq · Last.fm · Spotify · MusicBrainz · Gmail
         └──────┬───────┘
         ┌──────▼───────┐
         │   Supabase   │  Postgres · Auth · Storage
         └──────────────┘
```

Los dos frontends se autentican con Supabase Auth y mandan el JWT al backend, que lo verifica antes de cada pedido. El acceso a la base pasa por el backend, que usa la service role key.

El backend está organizado en capas:

```
routes → validators (Zod) → controllers → services → repositories → Supabase
```

- `middlewares/`: autenticación, bloqueos, subida de archivos, rate limiting y manejo de errores.
- `entities/`: dan forma a los datos que devuelve la API.
- `helpers/`: lógica compartida (fechas, filtro de palabras, importaciones, mails).

## Estructura del repositorio

```
.
├── src/                 App de fans
│   ├── componentes/     Pantallas y componentes, una carpeta por sección
│   ├── context/         Sesión, usuario, tema y menú lateral
│   ├── services/        Llamadas a la API
│   └── utils/           Rutas, fechas, géneros, avisos
├── public/
├── backoffice/          App de moderación
│   └── src/paginas/
├── backend/
│   ├── src/
│   │   ├── routes/  controllers/  services/  repositories/
│   │   ├── validators/  middlewares/  entities/  helpers/  config/
│   │   └── server.js
│   └── tests/
├── supabase/            Scripts SQL
├── .github/workflows/
├── DESIGN.md            Sistema de diseño
└── vercel.json
```

## Instalación

Requisitos: Node.js 18 o superior y un proyecto de Supabase.

```bash
git clone https://github.com/clarawolman/FanMeet.git
cd FanMeet

cp .env.example .env
cp backend/.env.example backend/.env
cp backoffice/.env.example backoffice/.env
# completar los valores (ver Variables de entorno)

npm install      # también instala backend/ y backoffice/
npm run dev
```

| Servicio | URL |
|---|---|
| App de fans | http://localhost:5173 |
| Backend | http://localhost:4000 |
| Backoffice | http://localhost:5175 |

Para dar permisos de moderador a un usuario:

```sql
update usuario set rol = 'moderador' where mail = 'tu-mail';
```

## Variables de entorno

### Frontend (`.env`) y backoffice (`backoffice/.env`)

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `VITE_API_URL` | URL del backend |

### Backend (`backend/.env`)

| Variable | Req. | Descripción |
|---|---|---|
| `SUPABASE_URL` | Sí | URL del proyecto de Supabase |
| `SUPABASE_ANON_KEY` | Sí | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Service role key. No se comparte ni se versiona. |
| `CONCIERTO_ACCESS_CODE` | Sí | Código para unirse a un concierto |
| `PORT` | | Por defecto 4000 |
| `CORS_ORIGIN` | | URL de la app de fans |
| `FRONTEND_URL` | | Destino del link de confirmación de mail |
| `BACKOFFICE_URL` | | Link que se incluye en los mails de reportes |
| `GMAIL_USUARIO` / `GMAIL_CONTRASENA_APP` | | Cuenta para enviar mails. Si falta, los mails se muestran en consola. |
| `MAIL_MODERADOR` | | Destinatario de los avisos de reportes |
| `MINIMO_UNIDOS_PARA_NOTIFICAR` | | Por defecto 10 |
| `RECORDATORIOS_CADA_MINUTOS` | | Por defecto 15. Con 0 se desactivan. |
| `GROQ_API_KEY` | | Chatbot. Sin esta variable, `/api/chatbot` responde 503. |
| `GROQ_MODEL` / `GROQ_MODELOS_RESPALDO` | | Modelo principal y modelos de respaldo |
| `LASTFM_API_KEY` / `LASTFM_SHARED_SECRET` | | Last.fm |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | | Spotify (solo con token de la app, sin login de usuarios) |

Las variables opcionales no impiden que el backend arranque. Si falta alguna, solo dejan de funcionar los endpoints que dependen de ella.

## Base de datos

Correr los scripts de `supabase/` en el SQL Editor de Supabase, en este orden:

1. `backoffice.sql`
2. `grupos_generales.sql`
3. `perfil_momentos.sql`
4. `momentos_publicaciones.sql`
5. `spotify.sql`
6. `lastfm.sql`
7. `generos.sql`

En Supabase también hay que configurar dos cosas:

- **Authentication → Sign In / Providers → Email:** activar "Confirm email".
- **Authentication → URL Configuration:** agregar la URL de la app de fans en "Redirect URLs".

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta frontend, backend y backoffice |
| `npm run dev:frontend` / `dev:backend` / `dev:backoffice` | Levanta cada uno por separado |
| `npm run build` | Build de producción de la app de fans |
| `npm run lint` | ESLint |
| `npm test --prefix backend` | Tests del backend |

## Tests

```bash
cd backend
npm test
```

Los tests usan Vitest y Supertest. Cubren los servicios (matching, grupos, chat, chatbot, notificaciones, moderación, Last.fm, Spotify, etc.), las rutas principales, los validadores y los helpers. No necesitan conexión a Supabase.

## Deploy

| Parte | Plataforma | Configuración |
|---|---|---|
| App de fans | Vercel | Root Directory `/`. `vercel.json` redirige todas las rutas a `index.html`. |
| Backoffice | Vercel | Root Directory `backoffice` |
| Backend | Render | Start command `npm start`, con las variables de `backend/.env` |

El plan gratuito de Render apaga el servicio cuando no recibe pedidos. El workflow `.github/workflows/mantener-backend-despierto.yml` llama a `/health` cada 10 minutos para que no se apague.

## API

Todas las rutas van bajo `/api` y, salvo el registro y el inicio de sesión, requieren un JWT de Supabase en `Authorization: Bearer <token>`.

| Recurso | Ruta base |
|---|---|
| Autenticación | `/auth` |
| Usuarios | `/usuarios` |
| Conciertos | `/conciertos` |
| Grupos y mensajes de grupo | `/grupos` |
| Amistades | `/amistades` |
| Chats privados | `/chats` |
| Notificaciones | `/notificaciones` |
| Momentos | `/momentos` |
| Matching | `/matching` |
| Chatbot | `/chatbot` |
| Reportes | `/reportes` |
| Bloqueos | `/bloqueos` |
| Spotify / Last.fm | `/spotify`, `/lastfm` |
| Backoffice (solo moderadores) | `/backoffice` |

`GET /health` responde el estado del servicio.

## Decisiones técnicas

**Matching sin IA.** La compatibilidad entre fans, la sección Descubrir y las recomendaciones de la home salen de `matchingService.js`. Para cada usuario se arma un vector con sus artistas favoritos, lo que escucha en Last.fm, artistas similares, géneros elegidos y deducidos, conciertos y vibra, y los usuarios se comparan con similitud coseno.

**Géneros.** Spotify ya no devuelve géneros a apps nuevas. El buscador usa los aproximadamente 2200 géneros de MusicBrainz y, si no encuentra el término, los tags de Last.fm. Solo se guardan los géneros que algún usuario eligió.

**Privacidad del chatbot.** Las restricciones de Fani están en el código de sus herramientas (`faniHerramientas.js`), no en el prompt. Solo ve conciertos y grupos a los que el usuario está unido, nunca datos de otras personas, y respeta los bloqueos.

**Estado global con Context.** El usuario logueado, la sesión, el tema y el menú lateral se manejan con React Context (`src/context/`). Así se evita pasar `usuarioActual` por props en cada nivel. `UsuarioProvider` envuelve a `<App />` en `main.jsx`, y las pantallas lo leen con `useContext`.

**Rutas.** La app no usa un router. Cada pantalla tiene una URL que se puede reconstruir (`src/utils/rutas.js`), así que recargar o compartir un link lleva a la misma pantalla.

**Diseño.** El sistema de diseño (colores, tipografía, componentes, modo claro y oscuro) está documentado en [`DESIGN.md`](DESIGN.md).

## Equipo

| Nombre | Rol |
|---|---|
| | |
| | |
