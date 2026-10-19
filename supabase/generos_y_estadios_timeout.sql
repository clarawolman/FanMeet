-- ============================
-- Arreglos para los conciertos de 2027 (ver supabase/conciertos_timeout.md)
-- ============================
-- Se puede correr más de una vez sin duplicar nada.

-- 1) estadios_timeout.sql se corrió dos veces y quedaron repetidos Teatro
--    Colón, Parque de la Ciudad y C Art Media. Se deja el de id más bajo de
--    cada uno y se borran los otros, salvo que algún concierto ya los use.
delete from estadio e
using estadio original
where original.nombre = e.nombre
  and original.direccion = e.direccion
  and original.id_estadio < e.id_estadio
  and not exists (select 1 from concierto c where c.id_estadio = e.id_estadio);

-- 2) Géneros que faltaban: metal (Epica), electrónica (ULTRA) y clásica
--    (Einaudi). En minúscula, como el resto del catálogo.
insert into estilo_musical (nombre)
select nuevo.nombre
from (values ('metal'), ('electrónica'), ('clásica')) as nuevo (nombre)
where not exists (
  select 1 from estilo_musical em where lower(em.nombre) = nuevo.nombre
);

-- Para revisar cómo quedó:
select id_estadio, nombre, direccion from estadio order by nombre;
select id, nombre from estilo_musical order by id;
