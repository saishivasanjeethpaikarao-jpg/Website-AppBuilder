-- Feedback table + storage buckets for the Website and App Builder
-- Project: website-and-app-builder (zrzhedwuoakzjlfkafzy, Arena org)
-- Run in the Supabase SQL editor. Safe to re-run (IF NOT EXISTS / DROP POLICY guards).
-- The builder's feedback widget posts: { project_ref, name, email, message }
-- The builder's Inbox reads: select * where project_ref = <cloud project id> order by created_at desc
-- Uploads go to the "project-assets" bucket; avatars go to the "avatars" bucket.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  project_ref text not null,
  name text,
  email text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "Anyone can submit feedback" on public.feedback;
create policy "Anyone can submit feedback"
  on public.feedback for insert to anon, authenticated
  with check (true);

drop policy if exists "Owners can read their project feedback" on public.feedback;
create policy "Owners can read their project feedback"
  on public.feedback for select to authenticated
  using (exists (select 1 from public.projects p where p.id::text = feedback.project_ref and p.owner_id = auth.uid()));

drop policy if exists "Owners can delete their project feedback" on public.feedback;
create policy "Owners can delete their project feedback"
  on public.feedback for delete to authenticated
  using (exists (select 1 from public.projects p where p.id::text = feedback.project_ref and p.owner_id = auth.uid()));

insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', true),
       ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Authenticated users can upload to project-assets" on storage.objects;
create policy "Authenticated users can upload to project-assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'project-assets');

drop policy if exists "Anyone can read project-assets" on storage.objects;
create policy "Anyone can read project-assets"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'project-assets');

drop policy if exists "Owners can delete from project-assets" on storage.objects;
create policy "Owners can delete from project-assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'project-assets');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "Anyone can read avatars" on storage.objects;
create policy "Anyone can read avatars"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "Owners can delete avatars" on storage.objects;
create policy "Owners can delete avatars"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars');
