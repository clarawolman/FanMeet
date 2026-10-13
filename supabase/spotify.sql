-- Artistas favoritos del perfil (se buscan en el catalogo de Spotify).
-- Este archivo es idempotente: se puede volver a correr entero sin romper nada.

-- ============================
-- TABLA artista_favorito
-- Carrusel de artistas favoritos del perfil. Nombre e imagen se copian de
-- Spotify al agregarlo, para no depender de la API solo para mostrarlo.
-- ============================
create table if not exists artista_favorito (
  id_favorito bigint generated always as identity primary key,
  id_usuario uuid not null references usuario(id_usuario) on delete cascade,
  spotify_id text not null,
  nombre text not null,
  imagen text,
  created_at timestamptz not null default now(),
  unique (id_usuario, spotify_id)
);

create index if not exists artista_favorito_usuario_idx on artista_favorito (id_usuario);

alter table artista_favorito enable row level security;

drop policy if exists "artistas favoritos visibles para usuarios logueados" on artista_favorito;
create policy "artistas favoritos visibles para usuarios logueados"
  on artista_favorito for select
  using (auth.role() = 'authenticated');
