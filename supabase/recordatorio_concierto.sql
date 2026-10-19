-- ============================
-- Recordatorio el día del show
-- ============================
-- El backend le manda a cada fan unido una notificación
-- "recordatorio_concierto" el día del concierto (hora de Argentina).
-- Correr una vez en el SQL Editor.

-- 0) Antes de correr el resto, mirá el check actual y los tipos en uso.
--    Si aparece algún tipo que no está en la lista del paso 1, agregalo ahí.
select pg_get_constraintdef(oid) as check_actual
from pg_constraint
where conname = 'notificacion_tipo_check';

select tipo, count(*) from notificacion group by tipo order by tipo;

-- 1) Tipo nuevo de notificación.
alter table notificacion drop constraint if exists notificacion_tipo_check;
alter table notificacion add constraint notificacion_tipo_check
  check (tipo in (
    'concierto_unido', 'grupo_unido', 'solicitud_amistad', 'amistad_aceptada',
    'mensaje_grupo', 'mensaje_privado', 'novedad_concierto', 'momento_etiquetado',
    'cambio_grupo', 'recordatorio_concierto'
  ));

-- 2) Registro de recordatorios enviados: uno por concierto, usuario y día.
--    La clave primaria es lo que impide mandar dos veces el mismo
--    recordatorio, aunque el chequeo corra en dos procesos a la vez.
--    El día va en la clave para que, si el concierto se pasa a otra fecha,
--    se vuelva a recordar ese otro día.
create table if not exists recordatorio_concierto (
  id_concierto bigint not null references concierto(id_concierto) on delete cascade,
  id_usuario uuid not null references usuario(id_usuario) on delete cascade,
  fecha date not null,
  created_at timestamptz not null default now(),
  primary key (id_concierto, id_usuario, fecha)
);

-- Solo la usa el backend (service role): sin policies, nadie más la ve.
alter table recordatorio_concierto enable row level security;
