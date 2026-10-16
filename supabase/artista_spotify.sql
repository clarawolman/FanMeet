-- ============================
-- artista: id de Spotify
-- ============================
-- El backoffice elige el artista del concierto buscándolo en Spotify. Con
-- el id se avisa a los que lo siguen (artista_favorito.spotify_id) sin
-- depender de que el nombre esté escrito igual.
alter table artista add column if not exists spotify_id text unique;

-- Para buscar rápido a los seguidores de un artista.
create index if not exists artista_favorito_spotify_id_idx on artista_favorito (spotify_id);
