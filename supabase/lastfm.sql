-- "Lo que escuchás" del perfil: usuario de Last.fm vinculado a cada perfil.
-- Este archivo es idempotente: se puede volver a correr entero sin romper nada.
-- Requiere supabase/spotify.sql (tabla artista_favorito).

-- ============================
-- TABLA lastfm_cuenta
-- Solo guarda el nombre de usuario de Last.fm (es publico, no hay tokens).
-- RLS activado sin policies: la lee y escribe unicamente el backend.
-- ============================
create table if not exists lastfm_cuenta (
  id_usuario uuid primary key references usuario(id_usuario) on delete cascade,
  usuario_lastfm text not null,
  vinculado_at timestamptz not null default now()
);

alter table lastfm_cuenta enable row level security;

-- ============================
-- Limpieza: la conexion directa con Spotify (OAuth) se reemplazo por
-- Last.fm porque Spotify limita a 5 usuarios las apps en Development mode.
-- ============================
drop table if exists spotify_cuenta;
