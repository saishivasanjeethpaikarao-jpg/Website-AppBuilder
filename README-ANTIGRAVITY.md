# Website and App Builder — Antigravity handover

Live site: https://elhir.com (also https://website-and-app-builder-5b9.pages.dev)
Cloudflare Pages project: `website-and-app-builder` (branch `main` = production)
Supabase project: `website-and-app-builder` (ref `zrzhedwuoakzjlfkafzy`, region ap-south-1, Arena org)

## What this is

A single-file static web app. **The whole builder is `index.html`** (~469 KB, one file,
HTML + CSS + JS inline). There is no build step, no framework, no backend server.
Open it in a browser (or serve the folder) and it runs.

## Files in this pack

- `index.html` — the full builder (latest live build, 18 Nov 2026 evening)
- `supabase-schema.md` — database design (profiles, projects, project_files, checkpoints,
  published_sites, skills; RLS owner-only)
- `supabase-migration.sql` — original tables migration (already applied)
- `supabase-migration-feedback-buckets.sql` — feedback table + storage buckets
  (feedback table + `project-assets` + `avatars` buckets; run in the Supabase SQL editor)
- `supabase-config.md` — project URL + anon public key (public by design, already in the client)
- `replit-study.md` — study of replit.com (79 features inventoried, mapping of what is
  already built / feasible / not feasible) — the reference for the next features

## How the backend works

- Auth: Supabase Auth (email + password, Google, GitHub). **Login is mandatory** — the app
  shows the login screen first unless a live Supabase session exists. No local/offline
  accounts exist anymore (removed 18 Nov).
- Data: projects, files, checkpoints and skills sync to Postgres (owner-only RLS).
- Google sign-in works only for test users while the GCP OAuth app is in Testing status:
  arenaai.inofficial@gmail.com and saishivasanjeethpaikarao@gmail.com.
- `service_role` key: NEVER in client code, never in this pack. It lives only in the
  Supabase dashboard (masked).
- Publish: Vercel / Netlify / Cloudflare Pages / GitHub Pages / Render from inside the
  builder — each needs the user's own token pasted once in Settings (browser-only storage).
- AI generation: Universal Bring Your Own Key (BYOK) supporting Groq (Llama 3.3 70B & DeepSeek R1), Google AI Studio (Gemini 2.5 Flash/Pro), NVIDIA NIM (Llama 3.3), Anthropic Claude (Claude 3.7 Sonnet), OpenAI ChatGPT (GPT-4o), and Custom / OpenRouter / Ollama. Keys are stored strictly in client browser storage (`localStorage`) with $0 server compute bills. If no key is set, it gracefully defaults to offline templates.

## What is complete (live on elhir.com)

Plan Mode, task board, project brief + always-on instructions, templates gallery
(Blog, Coming soon), visual editor upgrade (alignment, direction, gap, padding/margin,
border, image swap), multi-artifact projects (website + slide decks + data views),
data tab (tables + uploads to the `project-assets` bucket), SEO helper (scores real
index.html, one-click fixes, sitemap.xml + robots.txt in every ZIP/publish),
self-check on every preview refresh, feedback widget + inbox (posts to the `feedback`
table), mandatory login, Gen Z redesign, Supabase wiring (auth + sync + checkpoints),
Universal BYOK AI Engine (Groq, Gemini, NVIDIA NIM, Claude, OpenAI, Custom),
quick AI model switcher pill in prompt composer, and Preview Self-Healing Error Bridge with 1-click Agent auto-fix.

## What is NOT done yet

1. **Sign-in smoke test** (needs a human on the live site): sign up / log in with email,
   Google and GitHub; check cloud sync works; check a file upload lands in the
   `project-assets` bucket and a feedback message lands in the Inbox.
2. **Next-round features** (from `replit-study.md`, "honourable mentions"): model picker
   for the generator, follow-up suggestions after a build, steer/queue messages while a
   build runs, multi-file project tree, PWA export, Replit-Auth-style login-page
   generation for user apps, GitHub commit/push from inside the builder.
3. **Cloudflare API token hygiene**: a live Cloudflare API token was pasted in chat on
   18 Nov 2026 and must be revoked in the Cloudflare dashboard (API Tokens). Never put
   API tokens in chat — use the Secure Vault flow if one is ever needed.

## Deploy

```bash
npx -y wrangler@latest pages deploy <folder-containing-index.html> \
  --project-name website-and-app-builder --branch main
```

Deploy needs a Cloudflare API token with Pages edit permission (set as
CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in the environment, never in a file).

## Rules the owner set

- NO pricing content anywhere in the builder (no prices, plans, credits, cost framing).
- Never copy Replit's text, images or design assets — study structure/function only,
  write original copy/design.
- Never promise a feature the code does not really do — the UI labels what is real
  ("In the builder") vs what is a Replit reference.
