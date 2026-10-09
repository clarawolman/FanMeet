-- Generos musicales traidos de afuera.
-- Spotify ya no expone generos a apps nuevas (el endpoint de genre seeds
-- da 404 y los artistas vienen sin "genres"), asi que se buscan en
-- MusicBrainz (~2200 generos) y, si no estan ahi, en los tags de Last.fm.
-- estilo_musical guarda solo los que alguien eligio, como artista_favorito
-- guarda los artistas de Spotify. El backend los inserta al elegirlos.
-- Este archivo es idempotente: se puede volver a correr entero sin romper nada.
-- Los ids 1-4 (pop, rock, urbano, indie) no se tocan: los usan los conciertos.

-- estilo_musical.id ya es identity, pero los primeros generos se cargaron
-- con el id puesto a mano: adelantamos su contador para que el proximo
-- insert no choque con un id que ya existe. Y le damos al backend
-- (service_role) permiso de usarlo.
do $$
declare
  secuencia text := pg_get_serial_sequence('public.estilo_musical', 'id');
begin
  perform setval(secuencia, greatest((select max(id) from public.estilo_musical), 1));
  execute format('grant usage, select on sequence %s to service_role', secuencia);
end $$;

-- Un genero no puede repetirse escrito con otras mayusculas.
create unique index if not exists estilo_musical_nombre_unico
  on estilo_musical (lower(nombre));

-- El backend (service_role) solo podia leer esta tabla: sin esto, guardar
-- un genero nuevo da "permission denied for table estilo_musical".
grant select, insert on estilo_musical to service_role;
