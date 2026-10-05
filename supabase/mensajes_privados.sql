-- Chat privado 1 a 1 entre amigos, en tiempo real, con fotos, tildes de
-- leido y notificaciones.
-- Este archivo es idempotente: se puede volver a correr entero sin romper nada.
-- Correrlo en Supabase -> SQL Editor.
--
-- El envio y el "marcar como leido" pasan por el backend (service role),
-- que es quien verifica que las dos personas sean amigas. Por eso no hay
-- policies de insert/update para el cliente: desde el navegador solo se
-- puede LEER (lo necesita Realtime), y solo los mensajes propios.

-- ============================
-- TABLA mensaje_privado
-- ============================
create table if not exists mensaje_privado (
  id_mensaje bigint generated always as identity primary key,
  id_emisor uuid not null references usuario(id_usuario) on delete cascade,
  id_receptor uuid not null references usuario(id_usuario) on delete cascade,
  contenido text not null default '',
  imagen text,
  leido boolean not null default false,
  created_at timestamptz not null default now(),
  check (id_emisor <> id_receptor)
);

-- (por si la tabla se creó con una versión anterior de este archivo)
alter table mensaje_privado add column if not exists imagen text;
alter table mensaje_privado alter column contenido set default '';

-- Un mensaje tiene texto, foto o las dos cosas.
alter table mensaje_privado drop constraint if exists mensaje_privado_contenido_check;
alter table mensaje_privado drop constraint if exists mensaje_privado_contenido_o_imagen;
alter table mensaje_privado add constraint mensaje_privado_contenido_o_imagen
  check (
    char_length(contenido) <= 2000
    and (char_length(trim(contenido)) > 0 or imagen is not null)
  );

create index if not exists mensaje_privado_emisor_idx on mensaje_privado (id_emisor, id_mensaje desc);
create index if not exists mensaje_privado_receptor_idx on mensaje_privado (id_receptor, id_mensaje desc);

alter table mensaje_privado enable row level security;

drop policy if exists "participantes ven sus mensajes privados" on mensaje_privado;
create policy "participantes ven sus mensajes privados"
  on mensaje_privado for select
  using (auth.uid() = id_emisor or auth.uid() = id_receptor);

-- ============================
-- Habilitar Realtime para la tabla (inserts = mensajes nuevos,
-- updates = tildes de leído)
-- ============================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'mensaje_privado'
  ) then
    alter publication supabase_realtime add table mensaje_privado;
  end if;
end $$;

-- ============================
-- Bucket de Storage para las fotos del chat. Público como avatars y
-- highlights: el backend guarda cada foto con un nombre aleatorio
-- (uuid), así que la URL no se puede adivinar.
-- ============================
insert into storage.buckets (id, name, public)
values ('chats', 'chats', true)
on conflict (id) do nothing;

-- ============================
-- notificacion: nuevo tipo 'mensaje_privado' (reutiliza la columna
-- id_usuario_relacionado = quien mandó el mensaje)
-- ============================
alter table notificacion drop constraint if exists notificacion_tipo_check;
alter table notificacion add constraint notificacion_tipo_check
  check (tipo in (
    'concierto_unido', 'grupo_unido', 'solicitud_amistad', 'amistad_aceptada',
    'mensaje_grupo', 'mensaje_privado'
  ));

-- ============================
-- Trigger: nuevo mensaje privado -> notifica al receptor.
-- Si ya tiene una notificación SIN LEER de ese mismo amigo, la actualiza
-- con el último mensaje en vez de crear otra (así 10 mensajes seguidos no
-- son 10 notificaciones).
-- ============================
-- security definer: igual que fn_notificar_mensaje_grupo, el emisor no es
-- quien recibe la notificación, así que hay que saltar la RLS.
create or replace function fn_notificar_mensaje_privado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nombre_emisor text;
  foto_emisor text;
  texto text;
  id_existente bigint;
begin
  select nombre, fotoperfil into nombre_emisor, foto_emisor
    from usuario where id_usuario = new.id_emisor;

  texto := case
    when char_length(trim(new.contenido)) > 0 then left(new.contenido, 80)
    else '📷 Foto'
  end;

  select id_notificacion into id_existente
    from notificacion
    where id_usuario = new.id_receptor
      and tipo = 'mensaje_privado'
      and id_usuario_relacionado = new.id_emisor
      and leida = false
    order by created_at desc
    limit 1;

  if id_existente is not null then
    update notificacion
      set descripcion = texto,
          imagen = foto_emisor,
          created_at = now()
      where id_notificacion = id_existente;
  else
    insert into notificacion (
      id_usuario, tipo, titulo, descripcion, imagen, id_usuario_relacionado
    ) values (
      new.id_receptor,
      'mensaje_privado',
      coalesce(nombre_emisor, 'Un amigo'),
      texto,
      foto_emisor,
      new.id_emisor
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notificar_mensaje_privado on mensaje_privado;
create trigger trg_notificar_mensaje_privado
  after insert on mensaje_privado
  for each row
  execute function fn_notificar_mensaje_privado();
