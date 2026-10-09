-- Chat con Fani, la asistente de IA de FanMeet (uno por usuario, como un chat
-- más de la lista, fijado arriba).
-- Este archivo es idempotente: se puede volver a correr entero sin romper nada.
-- Correrlo en Supabase -> SQL Editor.
--
-- Todo pasa por el backend (service role): guarda el mensaje del usuario,
-- le pregunta a la IA y guarda la respuesta. Desde el navegador no se
-- lee ni se escribe directo, así que no hay policies para el cliente.

create table if not exists mensaje_chatbot (
  id_mensaje bigint generated always as identity primary key,
  id_usuario uuid not null references usuario(id_usuario) on delete cascade,
  -- 'user' = lo que escribió el usuario, 'assistant' = respuesta de la IA
  rol text not null check (rol in ('user', 'assistant')),
  contenido text not null check (char_length(trim(contenido)) > 0 and char_length(contenido) <= 8000),
  created_at timestamptz not null default now()
);

create index if not exists mensaje_chatbot_usuario_idx on mensaje_chatbot (id_usuario, id_mensaje desc);

alter table mensaje_chatbot enable row level security;
