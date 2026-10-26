-- ============================
-- Configuración de la cuenta
-- ============================
-- Correr una vez en el SQL Editor (se puede correr de nuevo sin problema).
--
-- 1) usuario.preferencias: privacidad, notificaciones y Fani. Lo que no
--    está guardado toma el valor por defecto (ver backend/src/helpers/preferencias.js).
-- 2) usuario.ciudad: para sugerir conciertos y gente cerca.
-- 3) eliminar_cuenta(id): borra todo lo de un usuario en una sola
--    transacción (si algo falla no se borra nada).

alter table usuario add column if not exists preferencias jsonb not null default '{}'::jsonb;
alter table usuario add column if not exists ciudad text;

-- Devuelve las URLs de las fotos de momentos que quedaron sin dueño, para
-- que el backend las borre del bucket "highlights".
create or replace function eliminar_cuenta(p_id uuid)
returns table (url text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_momento record;
  v_grupo record;
  v_otro uuid;
  v_urls text[] := '{}';
begin
  -- Momentos: si alguien más lo tiene en su perfil, queda a su nombre;
  -- si no, se borra con sus fotos, me gusta y comentarios.
  for v_momento in
    select h.id_highlight, h.id_usuario, h.url_imagen
    from highlight h
    where h.id_usuario = p_id
       or exists (select 1 from highlight_usuario hu where hu.id_highlight = h.id_highlight and hu.id_usuario = p_id)
  loop
    v_otro := null;
    select hu.id_usuario into v_otro
    from highlight_usuario hu
    where hu.id_highlight = v_momento.id_highlight and hu.id_usuario <> p_id and hu.estado = 'aceptado'
    limit 1;

    if v_otro is null then
      v_urls := v_urls
        || array(select f.url_imagen from highlight_foto f where f.id_highlight = v_momento.id_highlight)
        || v_momento.url_imagen;
      delete from highlight_comentario_like
        where id_comentario in (select id_comentario from highlight_comentario where id_highlight = v_momento.id_highlight);
      delete from highlight_comentario where id_highlight = v_momento.id_highlight and id_respuesta_a is not null;
      delete from highlight_comentario where id_highlight = v_momento.id_highlight;
      delete from highlight_like where id_highlight = v_momento.id_highlight;
      delete from highlight_guardado where id_highlight = v_momento.id_highlight;
      delete from highlight_foto where id_highlight = v_momento.id_highlight;
      delete from highlight_usuario where id_highlight = v_momento.id_highlight;
      delete from notificacion where id_highlight = v_momento.id_highlight;
      delete from highlight where id_highlight = v_momento.id_highlight;
    elsif v_momento.id_usuario = p_id then
      update highlight set id_usuario = v_otro where id_highlight = v_momento.id_highlight;
    end if;
  end loop;

  -- Lo que hizo en momentos de otros
  delete from highlight_comentario_like
    where id_usuario = p_id
       or id_comentario in (
         select id_comentario from highlight_comentario
         where id_usuario = p_id
            or id_respuesta_a in (select id_comentario from highlight_comentario where id_usuario = p_id)
       );
  delete from highlight_comentario
    where id_respuesta_a in (select id_comentario from highlight_comentario where id_usuario = p_id);
  delete from highlight_comentario where id_usuario = p_id;
  delete from highlight_like where id_usuario = p_id;
  delete from highlight_guardado where id_usuario = p_id;
  delete from highlight_usuario where id_usuario = p_id;

  -- Grupos que creó: pasan a otro integrante; si no queda nadie, se borran.
  for v_grupo in select g.id_grupo from grupo g where g.id_creador = p_id loop
    v_otro := null;
    select gu.id_usuario into v_otro
    from grupos_usuarios gu
    where gu.id_grupo = v_grupo.id_grupo and gu.id_usuario <> p_id
    limit 1;

    if v_otro is null then
      delete from notificacion where id_grupo = v_grupo.id_grupo;
      delete from mensaje_grupo where id_grupo = v_grupo.id_grupo;
      delete from grupos_usuarios where id_grupo = v_grupo.id_grupo;
      update reporte set id_grupo = null where id_grupo = v_grupo.id_grupo;
      delete from grupo where id_grupo = v_grupo.id_grupo;
    else
      update grupo set id_creador = v_otro where id_grupo = v_grupo.id_grupo;
    end if;
  end loop;

  delete from mensaje_grupo where id_usuario = p_id;
  delete from grupos_usuarios where id_usuario = p_id;
  delete from mensaje_privado where id_emisor = p_id or id_receptor = p_id;
  delete from mensaje_chatbot where id_usuario = p_id;
  delete from notificacion where id_usuario = p_id or id_usuario_relacionado = p_id;
  delete from amistad where id_solicitante = p_id or id_receptor = p_id;
  delete from bloqueo where id_bloqueador = p_id or id_bloqueado = p_id;
  delete from reporte where id_reportante = p_id or id_reportado = p_id;
  delete from recordatorio_concierto where id_usuario = p_id;
  delete from usuarios_conciertos where id_usuario = p_id;
  delete from artista_favorito where id_usuario = p_id;
  delete from estilo_musical_usuario where id_usuario = p_id;
  delete from lastfm_cuenta where id_usuario = p_id;
  delete from usuario where id_usuario = p_id;

  return query select distinct u from unnest(v_urls) as u where u is not null;
end;
$$;

-- Solo el backend (service role) la puede llamar.
revoke all on function eliminar_cuenta(uuid) from public, anon, authenticated;
