-- Habilita: editar foto de perfil, elegir géneros en el registro/perfil,
-- y que el perfil respete lo elegido en Registro3 (géneros + vibra de show).
-- Igual que el resto de las migraciones de este repo, la app solo tiene la
-- anon key, así que esto hay que correrlo a mano en el SQL editor de Supabase.

-- ─────────────────────────────
-- 1) Fotos de perfil: bucket "avatars"
-- ─────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_bucket_read_public" on storage.objects;
create policy "avatars_bucket_read_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_bucket_insert_own" on storage.objects;
create policy "avatars_bucket_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_bucket_update_own" on storage.objects;
create policy "avatars_bucket_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_bucket_delete_own" on storage.objects;
create policy "avatars_bucket_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────
-- 2) usuario: cada persona puede actualizar su propia fila
--    (necesario para guardar fotoperfil y estilo_asistencia).
-- ─────────────────────────────
alter table public.usuario enable row level security;

drop policy if exists "usuario_update_own" on public.usuario;
create policy "usuario_update_own"
  on public.usuario for update
  using (auth.uid() = id_usuario)
  with check (auth.uid() = id_usuario);

-- La fila se crea justo después de supabase.auth.signUp(), con
-- id_usuario = authData.user.id, así que esta policy debe existir para
-- que el registro no falle silenciosamente por RLS.
drop policy if exists "usuario_insert_own" on public.usuario;
create policy "usuario_insert_own"
  on public.usuario for insert
  with check (auth.uid() = id_usuario);

-- ─────────────────────────────
-- 3) estilo_musical: catálogo público de géneros.
--    Se lee incluso en Registro3, antes de que la persona tenga sesión,
--    así que "anon" también necesita poder leerlo.
-- ─────────────────────────────
alter table public.estilo_musical enable row level security;
grant select on public.estilo_musical to anon, authenticated;

drop policy if exists "estilo_musical_select_public" on public.estilo_musical;
create policy "estilo_musical_select_public"
  on public.estilo_musical for select
  using (true);

-- ─────────────────────────────
-- 4) estilo_musical_usuario: géneros favoritos de cada persona.
--    Lectura pública (se muestran en el perfil de cualquiera),
--    escritura/borrado solo del dueño de la fila.
-- ─────────────────────────────
alter table public.estilo_musical_usuario enable row level security;
grant select, insert, delete on public.estilo_musical_usuario to authenticated;
grant select on public.estilo_musical_usuario to anon;

drop policy if exists "estilo_musical_usuario_select_public" on public.estilo_musical_usuario;
create policy "estilo_musical_usuario_select_public"
  on public.estilo_musical_usuario for select
  using (true);

drop policy if exists "estilo_musical_usuario_insert_own" on public.estilo_musical_usuario;
create policy "estilo_musical_usuario_insert_own"
  on public.estilo_musical_usuario for insert
  with check (auth.uid() = id_usuario);

drop policy if exists "estilo_musical_usuario_delete_own" on public.estilo_musical_usuario;
create policy "estilo_musical_usuario_delete_own"
  on public.estilo_musical_usuario for delete
  using (auth.uid() = id_usuario);
