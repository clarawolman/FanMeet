-- ============================
-- grupo: cupo de integrantes
-- ============================
-- null = sin límite. El creador cuenta como un lugar, por eso el mínimo es 2.
-- Correr una vez en el SQL Editor.
alter table grupo add column if not exists cupo integer;

alter table grupo drop constraint if exists grupo_cupo_check;
alter table grupo add constraint grupo_cupo_check
  check (cupo is null or cupo between 2 and 500);
