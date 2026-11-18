-- Supabase migration — Website and App Builder
-- Run in the Supabase dashboard SQL editor for project website-and-app-builder
-- (https://supabase.com/dashboard/project/zrzhedwuoakzjlfkafzy/sql).
-- Creates all tables + Row Level Security. Safe to re-run (IF NOT EXISTS / OR REPLACE).

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  location text,
  website text,
  avatar_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- projects ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  kind text not null default 'website' check (kind in ('website', 'web-app')),
  thumbnail_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_opened_at timestamptz
);
create index if not exists projects_owner_idx on public.projects (owner_id);

-- ---------- project_files ----------
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  path text not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (project_id, path)
);
create index if not exists project_files_project_idx on public.project_files (project_id);

-- ---------- checkpoints ----------
create table if not exists public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  version integer not null,
  label text,
  snapshot jsonb not null,
  is_bookmarked boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists checkpoints_project_idx on public.checkpoints (project_id);

-- ---------- published_sites ----------
create table if not exists public.published_sites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  provider text not null,
  url text not null,
  deployment_id text,
  created_at timestamptz not null default now()
);
create index if not exists published_sites_project_idx on public.published_sites (project_id);

-- ---------- skills ----------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  instructions text,
  is_builtin boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists skills_owner_idx on public.skills (owner_id);

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_files enable row level security;
alter table public.checkpoints enable row level security;
alter table public.published_sites enable row level security;
alter table public.skills enable row level security;

-- profiles: only your own row
drop policy if exists "profiles own" on public.profiles;
create policy "profiles own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- projects: your own rows; public projects readable by anyone
drop policy if exists "projects own" on public.projects;
create policy "projects own" on public.projects
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "projects public read" on public.projects;
create policy "projects public read" on public.projects
  for select using (is_public = true);

-- project_files / checkpoints / published_sites: only via a project you own
drop policy if exists "project_files own" on public.project_files;
create policy "project_files own" on public.project_files
  for all using (exists (
    select 1 from public.projects p
    where p.id = project_files.project_id and p.owner_id = auth.uid()
  )) with check (exists (
    select 1 from public.projects p
    where p.id = project_files.project_id and p.owner_id = auth.uid()
  ));

drop policy if exists "checkpoints own" on public.checkpoints;
create policy "checkpoints own" on public.checkpoints
  for all using (exists (
    select 1 from public.projects p
    where p.id = checkpoints.project_id and p.owner_id = auth.uid()
  )) with check (exists (
    select 1 from public.projects p
    where p.id = checkpoints.project_id and p.owner_id = auth.uid()
  ));

drop policy if exists "published_sites own" on public.published_sites;
create policy "published_sites own" on public.published_sites
  for all using (exists (
    select 1 from public.projects p
    where p.id = published_sites.project_id and p.owner_id = auth.uid()
  )) with check (exists (
    select 1 from public.projects p
    where p.id = published_sites.project_id and p.owner_id = auth.uid()
  ));

-- skills: your own rows + all built-ins readable
drop policy if exists "skills own" on public.skills;
create policy "skills own" on public.skills
  for all using (auth.uid() = owner_id or owner_id is null)
  with check (auth.uid() = owner_id);
drop policy if exists "skills builtin read" on public.skills;
create policy "skills builtin read" on public.skills
  for select using (is_builtin = true);
