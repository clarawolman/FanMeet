-- Backoffice / moderación: estados y rol de usuario, reportes y avisos
-- de novedades de conciertos.
-- Este archivo es idempotente: se puede volver a correr entero sin romper nada.
-- Requiere que supabase/mensajes_grupo.sql y supabase/mensajes_privados.sql
-- ya hayan corrido.

-- ============================
-- usuario: estado y rol
-- ============================
-- estado: 'activo' usa la app normalmente; 'suspendido' queda vetado de
-- toda la app (no puede iniciar sesión ni usar la API, y su mail no se
-- puede volver a registrar porque la fila sigue existiendo).
alter table usuario add column if not exists estado text not null default 'activo';
alter table usuario drop constraint if exists usuario_estado_check;
alter table usuario add constraint usuario_estado_check
  check (estado in ('activo', 'suspendido'));

alter table usuario add column if not exists motivo_suspension text;
alter table usuario add column if not exists suspendido_at timestamptz;

-- rol: 'moderador' puede entrar al backoffice.
alter table usuario add column if not exists rol text not null default 'usuario';
alter table usuario drop constraint if exists usuario_rol_check;
alter table usuario add constraint usuario_rol_check
  check (rol in ('usuario', 'moderador'));

-- ============================
-- TABLA reporte
-- ============================
-- Solo la usa el backend (service role): RLS activo y sin policies, así
-- nadie la puede leer ni escribir con la anon key.
create table if not exists reporte (
  id_reporte bigint generated always as identity primary key,
  id_reportante uuid not null references usuario(id_usuario) on delete cascade,
  id_reportado uuid not null references usuario(id_usuario) on delete cascade,
  -- Grupo donde pasó (opcional). Si es null, se mira el chat privado.
  id_grupo bigint references grupo(id_grupo) on delete set null,
  motivo text not null check (char_length(trim(motivo)) > 0 and char_length(motivo) <= 1000),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'sancionado', 'descartado')),
  resolucion text,
  id_moderador uuid references usuario(id_usuario) on delete set null,
  resuelto_at timestamptz,
  created_at timestamptz not null default now(),
  check (id_reportante <> id_reportado)
);

create index if not exists reporte_estado_idx on reporte (estado, created_at desc);
create index if not exists reporte_reportado_idx on reporte (id_reportado);

alter table reporte enable row level security;

-- ============================
-- Mensajes: solo se escriben desde el backend
-- ============================
-- El backend (service role) es el que valida membresía, que la cuenta
-- esté activa y el filtro de malas palabras. Si quedara la policy de
-- insert, un usuario podría saltear todo eso insertando directo con la
-- anon key desde el navegador.
drop policy if exists "miembros envian mensajes al grupo" on mensaje_grupo;

-- ============================
-- notificacion: nuevo tipo para novedades de conciertos
-- ============================
alter table notificacion drop constraint if exists notificacion_tipo_check;
alter table notificacion add constraint notificacion_tipo_check
  check (tipo in (
    'concierto_unido', 'grupo_unido', 'solicitud_amistad', 'amistad_aceptada',
    'mensaje_grupo', 'mensaje_privado', 'novedad_concierto'
  ));

-- ============================
-- Primer moderador
-- ============================
-- Cambiá el mail por el de la cuenta que va a entrar al backoffice y
-- corré esta línea (o hacelo desde Table Editor → usuario → rol).
-- update usuario set rol = 'moderador' where mail = 'tu-mail@ejemplo.com';
