# Supabase backend design — Website and App Builder

Prepared 2026-11-18. The backend pick is **Supabase** (Postgres + Auth + Storage + RLS, free tier).
Project decision still open: create new `website-and-app-builder` (blocked — free-plan limit of
2 active projects) or reuse the existing `AI Website Builder` project if it is empty/unused.
If reusing: inspect its existing tables, policies and Auth config FIRST and adapt this design
to what is there. Never drop anything without checking.

## Project setup
- Region: **ap-south-1 (Mumbai)**.
- Auth providers: email + password, Google, GitHub (mirrors Replit login).
- Keys: the **anon key** goes in the Cloudflare-hosted frontend. The **service_role key
  NEVER goes in client code** — only in server-side/edge use, if ever.
- Email confirmations on for email sign-ups.

## Tables (all with Row Level Security on)

### profiles
One row per auth user. Auto-created by a trigger on `auth.users` insert.
- `id uuid PK` → `auth.users.id`
- `username text unique`, `display_name text`, `bio text`, `location text`,
  `website text`, `avatar_color text`
- `created_at timestamptz`, `updated_at timestamptz`

### projects
One row per user project (website or web app).
- `id uuid PK`, `owner_id uuid → profiles.id`
- `name text`, `description text`, `kind text` (`website` | `web-app`)
- `thumbnail_url text`, `is_public boolean default false` (for Gallery/templates later)
- `created_at`, `updated_at`, `last_opened_at`

### project_files
The actual code. One row per file per project (replaces the in-browser `index.html` /
`styles.css` / `script.js` tabs, and supports extra files).
- `id uuid PK`, `project_id uuid → projects.id`
- `path text` (e.g. `index.html`), `content text`
- `updated_at timestamptz`
- `unique (project_id, path)`

### checkpoints
Full snapshots for History / rollback (Replit checkpoints).
- `id uuid PK`, `project_id uuid → projects.id`
- `version int`, `label text`, `snapshot jsonb` (full file set: path → content)
- `is_bookmarked boolean default false`
- `created_at timestamptz`
- Rollback = copy `snapshot` back into `project_files`.

### published_sites
Record of real deploys (Vercel / Netlify / Cloudflare Pages / GitHub Pages).
- `id uuid PK`, `project_id uuid → projects.id`
- `provider text`, `url text`, `deployment_id text`
- `created_at timestamptz`

### skills
Built-in + custom skill packs (replaces the in-browser skill store).
- `id uuid PK`, `owner_id uuid → profiles.id` (null for built-ins)
- `name text`, `description text`, `instructions text`
- `is_builtin boolean default false`
- `created_at timestamptz`

## RLS rules (the core of "separate accounts")
- A signed-in user can read/write **only rows where `owner_id = auth.uid()`**
  (profiles: only their own row; projects/files/checkpoints/skills: only their own).
- `projects` rows with `is_public = true` are readable by anyone (Gallery later).
- Nothing is readable anonymously except public projects. No service_role key in the client.

## Storage buckets
- `avatars` (public) — profile pictures, per-user folder `avatars/<user-id>/`.
- `project-assets` (private) — images/files uploaded into a project,
  per-project folder `project-assets/<project-id>/`.

## What is NOT in v1
- Realtime / multiplayer cursors (defer — needs presence + a different data model).
- Secrets/tokens in the cloud: publish tokens (Vercel/Netlify/Cloudflare/GitHub)
  stay in the user's browser for now, exactly as today. Cloud token storage needs a
  separate decision (encrypted vault), never plain text in a table.

## Frontend wiring (when the project exists)
- Add `@supabase/supabase-js` to the static artifact; initialise with Project URL + anon key.
- Auth screen talks to Supabase Auth (replacing the per-device accounts, which stay
  as the offline fallback when signed out).
- `wb_*` localStorage stores become the offline cache; Supabase is the source of truth
  when signed in. Existing local projects migrate into the signed-in account once.
- Honesty rule carries over: a feature is only marked "In the builder" when it is
  actually wired to the live project — no fake "live" labels.

## Migration
- One SQL file: tables + RLS policies + the `auth.users` → `profiles` trigger.
- Apply via the Supabase dashboard SQL editor after the project exists (or reuse check).
