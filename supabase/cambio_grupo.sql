-- ============================
-- notificacion: aviso de cambios en un grupo
-- ============================
-- Cuando el creador (o el backoffice) edita un grupo, sus integrantes
-- reciben una notificación "cambio_grupo". Correr una vez en el SQL Editor.
alter table notificacion drop constraint if exists notificacion_tipo_check;
alter table notificacion add constraint notificacion_tipo_check
  check (tipo in (
    'concierto_unido', 'grupo_unido', 'solicitud_amistad', 'amistad_aceptada',
    'mensaje_grupo', 'mensaje_privado', 'novedad_concierto', 'momento_etiquetado',
    'cambio_grupo'
  ));
