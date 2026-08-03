-- Highlights: profile posts/photos shown on the Profile screen.
-- I don't have service_role / DB access from the app's anon key, so this
-- migration needs to be run manually in the Supabase SQL editor.

create table if not exists public.highlight (
  id_highlight bigint generated always as identity primary key,
  id_usuario uuid not null references public.usuario(id_usuario) on delete cascade,
  url_imagen text not null,
  created_at timestamptz not null default now()
);

alter table public.highlight enable row level security;

create policy "highlight_select_public"
  on public.highlight for select
  using (true);

create policy "highlight_insert_own"
  on public.highlight for insert
  with check (auth.uid() = id_usuario);

create policy "highlight_delete_own"
  on public.highlight for delete
  using (auth.uid() = id_usuario);

-- Storage bucket for highlight images, public read, owner-only write.
insert into storage.buckets (id, name, public)
values ('highlights', 'highlights', true)
on conflict (id) do nothing;

create policy "highlights_bucket_read_public"
  on storage.objects for select
  using (bucket_id = 'highlights');

create policy "highlights_bucket_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'highlights'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "highlights_bucket_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'highlights'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
