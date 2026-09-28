-- Chat en tiempo real por grupo + notificaciones asociadas.
-- Este archivo es idempotente: se puede volver a correr entero sin romper nada.
-- Requiere que supabase/notificaciones.sql y supabase/solicitudes_amistad.sql
-- ya hayan corrido (tabla notificacion con columnas id_grupo e
-- id_usuario_relacionado).

-- ============================
-- TABLA mensaje_grupo
-- ============================
create table if not exists mensaje_grupo (
  id_mensaje bigint generated always as identity primary key,
  id_grupo bigint not null references grupo(id_grupo) on delete cascade,
  id_usuario uuid not null references usuario(id_usuario) on delete cascade,
  contenido text not null check (char_length(trim(contenido)) > 0 and char_length(contenido) <= 2000),
  created_at timestamptz not null default now()
);

alter table mensaje_grupo enable row level security;

drop policy if exists "miembros ven mensajes del grupo" on mensaje_grupo;
create policy "miembros ven mensajes del grupo"
  on mensaje_grupo for select
  using (
    exists (
      select 1 from grupos_usuarios gu
      where gu.id_grupo = mensaje_grupo.id_grupo
        and gu.id_usuario = auth.uid()
    )
  );

drop policy if exists "miembros envian mensajes al grupo" on mensaje_grupo;
create policy "miembros envian mensajes al grupo"
  on mensaje_grupo for insert
  with check (
    auth.uid() = id_usuario
    and exists (
      select 1 from grupos_usuarios gu
      where gu.id_grupo = mensaje_grupo.id_grupo
        and gu.id_usuario = auth.uid()
    )
  );

-- ============================
-- Habilitar Realtime para la tabla
-- ============================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'mensaje_grupo'
  ) then
    alter publication supabase_realtime add table mensaje_grupo;
  end if;
end $$;

-- ============================
-- notificacion: nuevo tipo (reutiliza columnas id_grupo e
-- id_usuario_relacionado que ya existen)
-- ============================
alter table notificacion drop constraint if exists notificacion_tipo_check;
alter table notificacion add constraint notificacion_tipo_check
  check (tipo in ('concierto_unido', 'grupo_unido', 'solicitud_amistad', 'amistad_aceptada', 'mensaje_grupo'));

-- ============================
-- Trigger: nuevo mensaje -> notifica a los demas miembros del grupo
-- ============================
-- security definer: el emisor del mensaje no es quien recibe la
-- notificacion, asi que necesitamos saltar la RLS de notificacion, que solo
-- deja crear notificaciones propias desde el cliente.
create or replace function fn_notificar_mensaje_grupo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nombre_emisor text;
  foto_emisor text;
  nombre_grupo text;
  fila_receptor record;
begin
  select nombre, fotoperfil into nombre_emisor, foto_emisor
    from usuario where id_usuario = new.id_usuario;

  select nombre into nombre_grupo from grupo where id_grupo = new.id_grupo;

  for fila_receptor in
    select gu.id_usuario
    from grupos_usuarios gu
    where gu.id_grupo = new.id_grupo
      and gu.id_usuario <> new.id_usuario
  loop
    insert into notificacion (
      id_usuario, tipo, titulo, descripcion, imagen, id_usuario_relacionado, id_grupo
    ) values (
      fila_receptor.id_usuario,
      'mensaje_grupo',
      coalesce(nombre_grupo, 'Tu grupo'),
      coalesce(nombre_emisor, 'Alguien') || ': ' || left(new.contenido, 80),
      foto_emisor,
      new.id_usuario,
      new.id_grupo
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_notificar_mensaje_grupo on mensaje_grupo;
create trigger trg_notificar_mensaje_grupo
  after insert on mensaje_grupo
  for each row
  execute function fn_notificar_mensaje_grupo();
