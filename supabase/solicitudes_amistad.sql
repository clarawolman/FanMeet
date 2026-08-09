-- Solicitudes de amistad + notificaciones asociadas.
-- Este archivo es idempotente: se puede volver a correr entero sin romper nada.
-- Requiere que supabase/notificaciones.sql ya haya corrido (tabla notificacion).

-- ============================
-- TABLA amistad
-- ============================
create table if not exists amistad (
  id_amistad bigint generated always as identity primary key,
  id_solicitante uuid not null references usuario(id_usuario) on delete cascade,
  id_receptor uuid not null references usuario(id_usuario) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada')),
  created_at timestamptz not null default now()
);

alter table amistad enable row level security;

drop policy if exists "usuarios ven sus amistades" on amistad;
create policy "usuarios ven sus amistades"
  on amistad for select
  using (auth.uid() = id_solicitante or auth.uid() = id_receptor);

drop policy if exists "usuarios envian solicitudes de amistad" on amistad;
create policy "usuarios envian solicitudes de amistad"
  on amistad for insert
  with check (auth.uid() = id_solicitante);

drop policy if exists "receptor acepta solicitud de amistad" on amistad;
create policy "receptor acepta solicitud de amistad"
  on amistad for update
  using (auth.uid() = id_receptor)
  with check (auth.uid() = id_receptor);

drop policy if exists "usuarios eliminan sus solicitudes de amistad" on amistad;
create policy "usuarios eliminan sus solicitudes de amistad"
  on amistad for delete
  using (auth.uid() = id_solicitante or auth.uid() = id_receptor);

-- ============================
-- notificacion: nuevas columnas y tipos
-- ============================
alter table notificacion add column if not exists id_usuario_relacionado uuid references usuario(id_usuario) on delete cascade;
alter table notificacion add column if not exists id_amistad bigint references amistad(id_amistad) on delete cascade;

alter table notificacion drop constraint if exists notificacion_tipo_check;
alter table notificacion add constraint notificacion_tipo_check
  check (tipo in ('concierto_unido', 'grupo_unido', 'solicitud_amistad', 'amistad_aceptada'));

-- ============================
-- Trigger: nueva solicitud de amistad -> notifica al receptor
-- ============================
-- security definer: el receptor no es quien ejecuta el insert (lo hace el
-- solicitante), así que necesitamos saltar la RLS de notificacion, que solo
-- deja crear notificaciones propias desde el cliente.
create or replace function fn_notificar_solicitud_amistad()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nombre_solicitante text;
  foto_solicitante text;
begin
  select nombre, fotoperfil into nombre_solicitante, foto_solicitante
  from usuario
  where id_usuario = new.id_solicitante;

  insert into notificacion (
    id_usuario, tipo, titulo, descripcion, imagen, id_usuario_relacionado, id_amistad
  ) values (
    new.id_receptor,
    'solicitud_amistad',
    'Nueva solicitud de amistad',
    coalesce(nombre_solicitante, 'Alguien') || ' quiere conectar con vos.',
    foto_solicitante,
    new.id_solicitante,
    new.id_amistad
  );

  return new;
end;
$$;

drop trigger if exists trg_notificar_solicitud_amistad on amistad;
create trigger trg_notificar_solicitud_amistad
  after insert on amistad
  for each row
  execute function fn_notificar_solicitud_amistad();

-- ============================
-- Trigger: solicitud aceptada -> notifica a ambos que ahora se siguen
-- ============================
create or replace function fn_notificar_amistad_aceptada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nombre_solicitante text;
  foto_solicitante text;
  nombre_receptor text;
  foto_receptor text;
begin
  if new.estado = 'aceptada' and old.estado is distinct from 'aceptada' then
    -- la solicitud ya se resolvió: la notificación accionable deja de tener sentido
    delete from notificacion
      where id_amistad = new.id_amistad and tipo = 'solicitud_amistad';

    select nombre, fotoperfil into nombre_solicitante, foto_solicitante
      from usuario where id_usuario = new.id_solicitante;
    select nombre, fotoperfil into nombre_receptor, foto_receptor
      from usuario where id_usuario = new.id_receptor;

    insert into notificacion (
      id_usuario, tipo, titulo, descripcion, imagen, id_usuario_relacionado, id_amistad
    ) values (
      new.id_solicitante,
      'amistad_aceptada',
      'Nuevo seguidor',
      coalesce(nombre_receptor, 'Alguien') || ' ha comenzado a seguirte.',
      foto_receptor,
      new.id_receptor,
      new.id_amistad
    );

    insert into notificacion (
      id_usuario, tipo, titulo, descripcion, imagen, id_usuario_relacionado, id_amistad
    ) values (
      new.id_receptor,
      'amistad_aceptada',
      'Nuevo seguidor',
      coalesce(nombre_solicitante, 'Alguien') || ' ha comenzado a seguirte.',
      foto_solicitante,
      new.id_solicitante,
      new.id_amistad
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notificar_amistad_aceptada on amistad;
create trigger trg_notificar_amistad_aceptada
  after update on amistad
  for each row
  execute function fn_notificar_amistad_aceptada();
