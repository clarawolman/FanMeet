-- Tabla de notificaciones reales de FanMeet.
-- Este archivo es idempotente: se puede volver a correr entero sin romper nada.
-- id_usuario referencia usuario.id_usuario (uuid, = auth.uid())
-- id_concierto referencia concierto.id_concierto (bigint)
-- id_grupo referencia grupo.id_grupo (bigint)

create table if not exists notificacion (
  id_notificacion bigint generated always as identity primary key,
  id_usuario uuid not null references usuario(id_usuario) on delete cascade,
  tipo text not null check (tipo in ('concierto_unido', 'grupo_unido')),
  titulo text not null,
  descripcion text,
  imagen text,
  id_concierto bigint references concierto(id_concierto) on delete cascade,
  id_grupo bigint references grupo(id_grupo) on delete cascade,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notificacion add column if not exists leida boolean not null default false;

alter table notificacion enable row level security;

drop policy if exists "usuarios ven sus propias notificaciones" on notificacion;
create policy "usuarios ven sus propias notificaciones"
  on notificacion for select
  using (auth.uid() = id_usuario);

drop policy if exists "usuarios crean sus propias notificaciones" on notificacion;
create policy "usuarios crean sus propias notificaciones"
  on notificacion for insert
  with check (auth.uid() = id_usuario);

drop policy if exists "usuarios eliminan sus propias notificaciones" on notificacion;
create policy "usuarios eliminan sus propias notificaciones"
  on notificacion for delete
  using (auth.uid() = id_usuario);

drop policy if exists "usuarios actualizan sus propias notificaciones" on notificacion;
create policy "usuarios actualizan sus propias notificaciones"
  on notificacion for update
  using (auth.uid() = id_usuario)
  with check (auth.uid() = id_usuario);
