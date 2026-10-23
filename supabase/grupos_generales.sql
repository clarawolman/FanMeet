-- ============================
-- grupo: grupos generales (varias fechas) y tipo "comunidad"
-- ============================
-- Cuando un artista toca varios días seguidos en el mismo estadio, un grupo
-- puede ser de todas esas fechas: ids_conciertos guarda los conciertos que
-- abarca (id_concierto sigue siendo la primera fecha). null = grupo de una
-- sola fecha, como hasta ahora.
-- "comunidad" = grupo sin encuentro (sin fecha, hora ni punto de encuentro):
-- para charlar entre todos los que van.
-- Correr una vez en el SQL Editor.
alter type categoria_grupo add value if not exists 'comunidad';

alter table grupo add column if not exists ids_conciertos integer[];

-- Para buscar los grupos de un concierto (ids_conciertos @> '{70}').
create index if not exists grupo_ids_conciertos_idx on grupo using gin (ids_conciertos);
