-- ============================
-- Bloquear usuarios
-- ============================
-- Quién bloqueó a quién. El bloqueo vale en los dos sentidos (ninguno de
-- los dos ve al otro ni le puede escribir), pero solo quien bloqueó lo
-- puede deshacer. Lo valida el backend (service role). Correr una vez en
-- el SQL Editor.
create table if not exists bloqueo (
  id_bloqueador uuid not null references usuario(id_usuario) on delete cascade,
  id_bloqueado uuid not null references usuario(id_usuario) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (id_bloqueador, id_bloqueado),
  check (id_bloqueador <> id_bloqueado)
);

-- Para buscar rápido "quién me bloqueó".
create index if not exists bloqueo_id_bloqueado_idx on bloqueo (id_bloqueado);

-- Solo la usa el backend: sin policies, nadie más la ve.
alter table bloqueo enable row level security;
