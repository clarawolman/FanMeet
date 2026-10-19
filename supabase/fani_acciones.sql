-- ============================
-- Acciones de Fani (el chatbot)
-- ============================
-- Cuando Fani propone hacer algo (por ahora, sumarte a un grupo), la
-- propuesta queda guardada en su mensaje y en el chat aparecen los botones
-- Confirmar / Cancelar. Fani nunca hace la acción sola: la hace el backend
-- cuando el usuario toca Confirmar.
--
-- Formato de accion:
--   { "tipo": "unirse_grupo", "estado": "pendiente" | "hecha" | "cancelada",
--     "id_grupo": 12, "grupo": "Previa en Palermo", "concierto": "Fifty Something" }
--
-- La tabla solo la usa el backend (service role). Correr una vez en el SQL
-- Editor, antes de probar.

alter table mensaje_chatbot add column if not exists accion jsonb;
