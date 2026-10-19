-- ============================
-- estadio: los que faltan para los conciertos de 2027
-- ============================
-- El backoffice solo deja elegir estadios que ya existen, así que estos se
-- cargan a mano (SQL Editor de Supabase) antes de crear los conciertos.
-- Ver supabase/conciertos_timeout.md.
insert into estadio (nombre, direccion, ciudad) values
  ('Teatro Colón', 'Cerrito 628', 'Buenos Aires'),
  ('Parque de la Ciudad', 'Av. Escalada y Av. Fernández de la Cruz', 'Buenos Aires'),
  ('C Art Media', 'Av. Corrientes 6271', 'Buenos Aires'),
  -- Microestadio de Argentinos Juniors (La Paternal).
  ('Estadio Malvinas Argentinas', 'Gutenberg 350', 'Buenos Aires');
