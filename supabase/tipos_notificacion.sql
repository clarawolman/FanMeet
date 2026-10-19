-- ============================
-- Tipos de notificación (después de juntar mejoras con main)
-- ============================
-- La branch mejoras sumó 'cambio_grupo' y 'recordatorio_concierto', y main
-- sumó los avisos de momentos ('momento_like', 'momento_comentario'). Cada
-- SQL redefinía la lista entera, así que el último que se corrió dejó
-- afuera los tipos del otro. Este los junta todos. Correr una vez en el
-- SQL Editor (se puede correr de nuevo sin problema).

-- 0) Para ver cómo está ahora:
select pg_get_constraintdef(oid) from pg_constraint where conname = 'notificacion_tipo_check';

-- 1) Lista completa:
alter table notificacion drop constraint if exists notificacion_tipo_check;
alter table notificacion add constraint notificacion_tipo_check
  check (tipo in (
    'concierto_unido', 'grupo_unido', 'solicitud_amistad', 'amistad_aceptada',
    'mensaje_grupo', 'mensaje_privado', 'novedad_concierto', 'momento_etiquetado',
    'momento_like', 'momento_comentario', 'cambio_grupo', 'recordatorio_concierto'
  ));
