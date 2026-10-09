# FanMeet

## Setup inicial (una sola vez por maquina)

Las claves de Supabase no estan en el repo por seguridad (la service role key da acceso total a la base de datos). Hay que copiarlas a mano la primera vez:

1. `cp .env.example .env` (raiz, variables del frontend)
2. `cp backend/.env.example backend/.env` (variables del backend)
3. Completar los valores en ambos archivos. Se consiguen en Supabase: Project Settings -> API.
   - `VITE_SUPABASE_URL` / `SUPABASE_URL`: "Project URL"
   - `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY`: "anon public" key
   - `SUPABASE_SERVICE_ROLE_KEY` (solo backend): "service_role" key. **Nunca compartir ni commitear.**
   - `SUPABASE_JWT_SECRET` (solo backend): Project Settings -> API -> JWT Settings

## Correr el proyecto

```
npm i
npm run dev
```

Esto instala las dependencias del frontend y del backend, y levanta ambos juntos:
- Frontend (Vite): http://localhost:5173
- Backend (Express): http://localhost:4000

## Música en el perfil: Last.fm + Spotify (opcional)

- **"Lo que escuchás"** (top artistas, canciones y álbumes por período y escuchas recientes) sale de **Last.fm**. Cada usuario escribe su nombre de usuario de Last.fm en el perfil; para que refleje lo que escucha en Spotify, tiene que vincular Spotify en last.fm -> Settings -> Applications.
- **Artistas favoritos** (carrusel) se buscan en el catálogo de **Spotify** con el token de la app, sin login de usuarios (no aplica el límite de usuarios del Development mode). Spotify también completa las fotos que Last.fm ya no da.

Setup:

1. Correr `supabase/spotify.sql`, después `supabase/lastfm.sql` y después `supabase/generos.sql` en el SQL Editor de Supabase.
2. API key de Last.fm: https://www.last.fm/api/account/create -> `LASTFM_API_KEY` en `backend/.env`.
3. App de Spotify: https://developer.spotify.com/dashboard (marcar "Web API") -> Client ID y Client Secret en `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` de `backend/.env`.

Sin estas variables el backend arranca igual; solo esos endpoints responden 503.

## Géneros y matching

- **Géneros**: Spotify ya no da géneros a apps nuevas, así que el buscador busca en los ~2200 géneros de **MusicBrainz** (sin API key) y, si lo escrito no está ahí, en los tags de **Last.fm** (ej. "rock nacional"). En `estilo_musical` se guardan solo los que alguien eligió. `supabase/generos.sql` le da al backend permiso de insertarlos.
- **Compatibilidad** (perfil ajeno), **Descubrir** (fans ordenados por compatibilidad) y **Para vos** (conciertos recomendados en la home) salen de `backend/src/services/matchingService.js`. No usa IA: arma un perfil musical de cada usuario (artistas favoritos, lo que escucha en Last.fm, artistas parecidos según Last.fm, géneros elegidos y deducidos de sus artistas, conciertos y vibra) y los compara con similitud coseno.

## TP React Context

### Qué información se comparte
El **usuario logueado** (`usuarioActual`) y su función para modificarlo (`setUsuarioActual`). Incluye los datos del perfil: `id_usuario`, `nombre`, `fotoperfil`, etc.

- Se carga al iniciar sesión o al terminar el registro (`App.jsx`).
- Se borra al cerrar sesión (`App.jsx`).
- Se actualiza cuando el usuario cambia su foto de perfil (`perfil.jsx`), y el cambio se ve en el resto de la app.

### Dónde se creó el Context
`src/context/UsuarioContext.jsx`: ahí se crea `UsuarioContext` con `createContext` y se define el componente `UsuarioProvider`, que guarda el estado con `useState`.

### Dónde está el Provider
En `src/main.jsx`, `<UsuarioProvider>` envuelve a `<App />`. Así todas las pantallas de la aplicación tienen acceso al usuario.

### Componentes que consumen el Context con `useContext`
| Componente | Para qué usa el usuario |
|---|---|
| `src/App.jsx` | Lo guarda al loguearse o registrarse, lo borra al cerrar sesión y decide qué pantallas se pueden mostrar |
| `src/componentes/home/Home.jsx` | Carga los conciertos y las preferencias del usuario, y muestra su foto |
| `src/componentes/misEventos/MisEventos.jsx` | Carga los eventos a los que se unió el usuario |
| `src/componentes/misGrupos/MisGrupos.jsx` | Carga los grupos del usuario |
| `src/componentes/notificaciones/Notificaciones.jsx` | Carga las notificaciones del usuario |
| `src/componentes/perfil/perfil.jsx` | Muestra el perfil propio y actualiza la foto en el Context |
| `src/componentes/editarGeneros/EditarGeneros.jsx` | Carga y edita los géneros favoritos del usuario |
| `src/componentes/infoGrupos/infoGrupo.jsx` | Sabe si el usuario es el creador del grupo o si ya confirmó asistencia |
| `src/componentes/infoGrupos/chatGrupo.jsx` | Distingue los mensajes propios de los mensajes de otros |
| `src/componentes/crearGrupo/CrearGrupo.jsx` | Usa el id del usuario para crear el grupo |
| `src/componentes/concierto/FansUnidosLista.jsx` | Saca al propio usuario de la lista de fans |

### Por qué conviene usar Context en este caso
Antes, `usuarioActual` se guardaba con `useState` en `App.jsx` y se pasaba a mano por props a cada pantalla. Además, `Perfil` se lo reenviaba a `EditarGeneros` y había props derivados como `idUsuarioActual`, `usuarioActualId` y `onUsuarioActualizado`. Casi todas las pantallas necesitan saber quién está logueado, así que es un dato **global** de la aplicación. Pasarlo por props en cada nivel (*prop drilling*) hacía el código repetitivo y fácil de romper: si una pantalla nueva necesitaba el usuario, había que agregar el prop en `App.jsx` y en cada componente intermedio.

Con Context, el usuario está en un solo lugar. Cada componente que lo necesita lo lee con `useContext(UsuarioContext)` y los cambios, como la foto de perfil, se reflejan automáticamente en todos los componentes que lo consumen.
