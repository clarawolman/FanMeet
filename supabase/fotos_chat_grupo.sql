-- ============================
-- Fotos en los chats de grupo
-- ============================
-- Igual que mensaje_privado: un mensaje puede ser texto, foto o las dos
-- cosas. Las fotos van al bucket "chats" (ya existe, lo creó
-- mensajes_privados.sql), en la carpeta grupos/<id_grupo>/. Las sube el
-- backend después de validar que quien manda es integrante del grupo y que
-- el archivo es de verdad un jpg, png o webp. Correr una vez en el SQL
-- Editor.

-- 0) Antes de correr el resto, mirá la versión actual del trigger. Si tiene
--    algo que no está en el paso 3 (además del texto de la notificación),
--    avisá antes de reemplazarla.
select pg_get_functiondef('fn_notificar_mensaje_grupo'::regproc);

-- 1) Columna para la foto.
alter table mensaje_grupo add column if not exists imagen text;
alter table mensaje_grupo alter column contenido set default '';

-- 2) Texto o foto (antes el texto era obligatorio).
alter table mensaje_grupo drop constraint if exists mensaje_grupo_contenido_check;
alter table mensaje_grupo drop constraint if exists mensaje_grupo_contenido_o_imagen;
alter table mensaje_grupo add constraint mensaje_grupo_contenido_o_imagen
  check (
    char_length(contenido) <= 2000
    and (char_length(trim(contenido)) > 0 or imagen is not null)
  );

-- 3) La notificación de un mensaje que es solo una foto dice "📷 Foto".
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
  texto text;
  fila_receptor record;
begin
  select nombre, fotoperfil into nombre_emisor, foto_emisor
    from usuario where id_usuario = new.id_usuario;

  select nombre into nombre_grupo from grupo where id_grupo = new.id_grupo;

  texto := case
    when char_length(trim(new.contenido)) > 0 then left(new.contenido, 80)
    else '📷 Foto'
  end;

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
      coalesce(nombre_emisor, 'Alguien') || ': ' || texto,
      foto_emisor,
      new.id_usuario,
      new.id_grupo
    );
  end loop;

  return new;
end;
$$;
