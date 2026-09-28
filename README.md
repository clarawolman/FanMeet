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
