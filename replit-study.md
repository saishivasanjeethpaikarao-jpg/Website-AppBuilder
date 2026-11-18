# Replit Feature Map — Study of the replit.com Website Mirror

**Source:** `replit.com.zip` (1.98 GB, 8,014 entries) — a static mirror of the public replit.com website.
Studied with Python `zipfile` (streamed reads, no full extraction). Read: 133 pages — the full
documentation set (`features/`, `core-concepts/`, `learn/`, `getting-started/`, `help/`) plus the
docs index (`replit.com/llms_txt.html`). All summaries below are written in original words from
the structure and function described in those pages; no Replit text, images, or design assets
were copied into this report.

**Method note / limits:** the mirror's marketing pages (homepage, gallery, templates pages) are
client-rendered shells with almost no extractable text, so the homepage/gallery layout below is
reconstructed from the docs home, the product docs, and the earlier verified Replit study
(18 Nov 2026). Anything the mirror could not show is marked as such. No prices, plan names as
selling points, or usage-meter figures appear anywhere in this report, per the builder's
no-pricing rule.

---

## 1. Feature inventory

### 1A. Agent — the build loop

| # | Feature | What it does | How it works (steps) | Source pages |
|---|---------|--------------|----------------------|--------------|
| 1 | Agent (plain-language builder) | Turns a typed description into a working app, design, slides, or files — no coding needed by the user | 1. Describe the outcome in the prompt box. 2. Agent plans, writes code, installs packages, runs the app. 3. User reviews the live preview, gives follow-ups, and publishes. | `features/agent/overview.html`, `getting-started/quickstarts/ask-ai.html`, `learn/build-with-agent.html` |
| 2 | Plan Mode | Lets the user brainstorm and approve a plan before any code or data changes | 1. Toggle Plan at the chat input. 2. Discuss approaches, trade-offs, scope, architecture. 3. Agent produces an ordered task list. 4. Revise, Cancel, or approve with "Build here" (same session) or "Build in background" (separate task). | `features/agent/plan-mode.html`, `learn/plan-vs-build-mode.html` |
| 3 | Build Mode | The normal mode: Agent writes and changes code directly | User gives a clear instruction; Agent implements it, runs the app, and reports what changed. Used when the goal is known or a plan is already approved. | `learn/plan-vs-build-mode.html` |
| 4 | Capability modes + Auto routing | Lets the user pick how capable the model behind Agent is for a job, or let the system route automatically | 1. Open the mode selector in the prompt box. 2. Pick a capability tier (everyday / mid / top) or Auto routing. 3. Optionally pick a specific model and set an Effort level. 4. Compare models side by side before sending. | `features/agent/agent-modes.html`, `features/agent/model-selector.html` |
| 5 | Task system / Task board | Breaks a build into small tasks that run in the background and are applied only after review | 1. Agent splits work into tasks (or the user creates one). 2. Tasks move Draft → Active → Queued → Ready → Applying → Done. 3. The board (Kanban) shows all tasks with filter, rename, and per-task settings. 4. From a Ready task, review the diff and Apply changes to the main version, or Dismiss. 5. Optional auto-approve-plan and auto-apply settings. | `features/agent/task-board.html`, `features/agent/task-lifecycle.html`, `core-concepts/agent/task-system.html`, `learn/build-in-parallel.html` |
| 6 | Follow-up tasks | After a build, Agent suggests the natural next steps as ready-made tasks | Suggestions appear after a task finishes; the user can start one, start several at once, or ignore them. | `features/agent/follow-up-tasks.html` |
| 7 | Steer & queue messages | Lets the user interrupt, redirect, or queue messages while Agent is working | While Agent works, the user can steer the current turn, queue follow-ups to be sent in order, or stop the active turn. Preferences control how follow-ups are sent. | `features/agent/steer-and-queue-messages.html` |
| 8 | App Testing (self-test in a real browser) | Agent tests the built app like a real user and fixes what it finds | 1. After building, Agent opens the app in a real browser inside the Agent pane. 2. It clicks through flows, enters mock data, checks UI, functionality, integrations, load behaviour, and accessibility. 3. It reports a summary, and auto-fixes issues found. 4. The user can replay the whole session as video and jump between sections. A skip button bypasses testing. Works for web apps only. | `features/agent/app-testing.html` |
| 9 | Agent Skills | Reusable instruction packs that teach Agent a library, pattern, or workflow | A skill has a name, a description (when Agent should use it), and instructions (steps to follow). Agent loads matching skills automatically. Users can create custom skills, share them across a workspace, import from a public GitHub URL, or browse a skills directory. Guidance: be selective, prefer proactive skills for repeated patterns. | `features/agent/skills.html`, `learn/agent-skills.html`, `features/agent/skills-directory.html` |
| 10 | Agent Customization | Workspace-wide defaults for how Agent behaves | Two tools: custom instructions (always-on guidance for every chat) and skills (used when relevant). Set at workspace level, managed from one screen, with permissions on who can create them. | `features/agent/agent-customization.html` |
| 11 | replit.md (project context file) | A file in the project root that tells Agent the project's conventions, stack, and preferences | Agent can generate it automatically from the project, or the user writes it. It covers architecture, coding patterns, package manager, and communication preferences. Delete it and start a new chat to regenerate. | `features/project-setup/replit-dot-md.html`, `core-concepts/agent/replit-dot-md.html` |
| 12 | Web Search (Agent research) | Lets Agent look things up on the web while planning or building | Agent searches when the task needs current facts, docs, or comparisons, and uses the results in the plan or the code. | `features/agent/web-search.html` |
| 13 | Voice Mode | Speak a prompt instead of typing it | Open Agent, tap the microphone in the chat box, speak; the transcription lands in the chat box for review before sending. | `features/agent/voice-mode.html` |
| 14 | Image generation (in Agent) | Generates images for the app being built | Agent decides when an image is needed (hero art, illustrations, placeholders) and generates it as part of the build; the user can refine with follow-ups. | `features/agent/image-generation.html` |
| 15 | Audio generation | Generates voice/audio content for apps | Agent produces audio assets (voice, sound) as part of a build, same flow as image generation. | `features/agent/audio-generation.html` |
| 16 | Charts in chat | Turns uploaded or connected data into interactive charts inside the chat | User provides data (upload or connected source); Agent builds bar, line, stacked-area, donut, Sankey, or heatmap charts; user refines by describing changes; charts can be carried into apps. | `features/agent/charts.html` |
| 17 | General Agent (chat-first work) | A chat surface for questions, research, analysis, and multi-output work without starting from a project | Ask a question, run a routine, or describe an outcome. One conversation can produce a website, a deck, and launch graphics; or turn a spreadsheet into a dashboard plus a findings deck. Uploads (docs, sheets, images) are understood and compared. | `features/agent/general-agent.html`, `features/chats-and-routines/chats.html` |
| 18 | Design Canvas | An infinite board for visual mockups and prototypes before committing to code | Frames on the board can be a design mockup, web app, mobile app, slides, image, video, or vector graphic. Generate frames from a chat prompt, the Generate menu, or the library. Add drawings, arrows, shapes, and sticky notes — Agent reads the markup, so circling a problem area and asking for a change works. A design system (contents + DESIGN.md) can be applied to an existing app. | `learn/projects-and-artifacts/canvas.html`, `learn/projects-and-artifacts/project-editor.html` |
| 19 | Visual Editor (click-to-edit) | Direct visual edits to text, colour, layout, and images — no Agent loop for simple changes | 1. Click an element in the canvas or the Preview. 2. A property panel offers text editing, colour, alignment (3×3 picker), direction (row/column), gap, outer spacing (per side, lockable), and inner spacing. 3. Simple edits apply deterministically to source code at once; only complex changes route through Agent. Works identically on canvas frames and in Preview; every edit syncs to source. | `learn/projects-and-artifacts/visual-editor.html` |
| 20 | Agentic commerce (shopping via chat) | Buy business supplies through a chat, with comparison and approval | Set up shopping, ask for products, compare options, review checkout details, and approve supported purchases with a linked wallet. Also handles subscriptions. | `features/agent/agentic-commerce.html` |
| 21 | MCP (Model Context Protocol) | Standard way for Agent to reach external tools and live data | Agent connects to MCP servers (e.g. Figma) to read designs or data and act on them. Skills and MCP servers are complementary: skills are instructions, MCP is live tool access. | `learn/model-context-protocol.html`, `features/agent/skills.html` |
| 22 | Connectors / integrations | First-party connections to 70+ services Agent can read and write from chat | Sign in once to a service (Google Drive/Docs/Sheets/Slides/Calendar/Gmail, GitHub, GitLab, Slack, Linear, Jira, Notion, Stripe, Shopify, BigQuery, Snowflake, and many more); Agent can then pull data, create records, and send messages, and build apps on top of them. Also: managed built-in integrations, external integrations (user provides API keys), and Agent services (third-party APIs Agent uses behind the scenes). | `features/integrations/overview.html`, `features/integrations/replit-ai-integrations.html` |
| 23 | Custom connectors | Build a connector for an API outside the built-in library | Define the API endpoint, configure authentication, test the endpoint, then Agent can use it. Aimed at organisation workspaces. | `features/integrations/custom-connectors.html` |
| 24 | Open in Replit (embed/import) | Lets other sites send users (and their code) into Replit | A link or button opens a repo, gist, or template directly in a Replit workspace. | `features/integrations/open-in-replit.html` |

### 1B. Workspace & editor

| # | Feature | What it does | How it works (steps) | Source pages |
|---|---------|--------------|----------------------|--------------|
| 25 | Project Editor (workspace shell) | The home base: chat with Agent, see the app take shape, manage everything | Layout: file tree left, editor centre, Preview/Console right, Run button top, command search (Cmd+K). Panes can be split horizontally/vertically, resized, rearranged, floated, or opened in new windows; several projects can be open at once. Tools dock holds Console, Shell, Git, Database, App Storage, Secrets, and more. | `features/editor/editor-and-tools.html`, `learn/projects-and-artifacts/project-editor.html` |
| 26 | File tree | Browse and manage project files | Select a folder to expand; drag a file into a pane to open it; duplicate, rename, move, download, or delete from the context menu. | `features/editor/editor-and-tools.html` |
| 27 | Preview (live webview) | Shows the running app inside the editor | Live web view with back/forward, an address field, screen-size presets for responsive testing, webview logs toggle, and "open in a new tab". Also hosts the iOS/Android simulator choice for mobile apps. | `features/editor/preview.html` |
| 28 | Console | Shows the app's output, errors, and activity logs in real time | Opens from Tools; shows the command that ran plus stdout/stderr; AI suggests fixes for errors; run history is kept; "Show only latest" and "Clear past runs" controls. | `features/workspace-tools/console.html` |
| 29 | Shell | A full terminal inside the editor | Run commands, install packages, use Git; anything run in Shell stays in sync with the Git pane. | `features/workspace-tools/shell.html` |
| 30 | Workflows (run buttons) | Configurable run buttons that execute chosen commands | Create a workflow from shell commands, package installs, or other workflows; run steps sequentially or in parallel (e.g. frontend + backend together); assign a workflow to the Run button; view outputs per workflow. | `features/workspace-tools/workflows.html`, `replit-workspace/workflows.html` |
| 31 | CLUI (graphical CLI) | A clickable, graphical form of the command line | Common commands are presented as forms/buttons instead of typed commands. | `features/workspace-tools/clui-graphical-cli.html` |
| 32 | Keyboard shortcuts | Speeds up editor work; shortcuts are viewable and customisable | Open the shortcuts list, rebind or remove shortcuts; tab navigation included. | `features/editor/keyboard-shortcuts.html` |
| 33 | Multiplayer (live co-editing) | Several people edit the same project at once | Presence, shared cursors, and live updates; documented in the workspace tools set (thin in this mirror). | `replit.com/llms_txt.html` (docs index) |
| 34 | Git pane | Visual version control with GitHub integration | Initialise a repo or connect a provider; review changes (additions/deletions highlighted); stage, commit, push, and pull; create/switch/merge branches; resolve conflicts visually; Shell Git commands stay in sync. | `features/workspace-tools/git-interface.html`, `learn/projects-and-artifacts/version-control.html` |
| 35 | File History | Per-file version history with compare, restore, and playback | Open a file's history, view earlier versions, compare with the current file, restore one, or play back the change sequence. | `features/version-control/file-history.html` |
| 36 | Secrets (env vars) | Encrypted storage for API keys and credentials | Add key/value pairs in the Secrets tool; values are hidden after entry; secrets sync from development to the published app automatically; database-related secrets and predefined environment variables are handled separately. | `replit-workspace/workspace-features/secrets.html`, `features/publishing/overview.html` |
| 37 | Security tooling | Keeps AI-written code and dependencies safe | Package Firewall blocks malicious packages at install time. Automatic dependency scans catch newly disclosed vulnerabilities; Auto-Protect can prepare Agent patches. Security Agent audits code, dependencies, and privacy issues before publishing (three scan levels). Project Security Center covers one project; Workspace Security Center covers the whole workspace. Publishing can be blocked when critical findings exist. | `features/security/overview.html`, `features/security/package-firewall.html`, `features/security/agent-security-scans.html`, `features/security/project-security-center.html`, `learn/security-checklist.html` |
| 38 | Dependency management | Installs and tracks packages | Install via Shell or by asking Agent; automatic import detection adds missing packages; Python package managers and system dependencies are supported; packager config lives in project settings. | `features/project-setup/dependency-management.html` |
| 39 | Ports & networking | Configures which ports the app serves and previews | Default port, per-port config in the project file, a networking tool for debugging, and port preferences. | `features/project-setup/ports.html` |
| 40 | Project configuration | The files that define a project | `.replit` (run commands, deployment, ports), `replit.nix` (system dependencies), environment variables, and packager config. | `features/project-setup/configuration.html` |
| 41 | Extensions (plugin API) | Lets developers build tools that run inside the editor | An extensions API (auth, background scripts, commands, data, debug, editor, exec, fs, init, messages, session, themes, and more), React hooks, devtools, and a publish flow for the extensions marketplace. | `replit.com/llms_txt.html` (docs index) |
| 42 | User settings & themes | Personal editor preferences | Theme, keybindings, and editor preferences under User Settings; separate from workspace and account settings. | `features/editor/user-settings.html` (via docs index) |

### 1C. Projects, artifacts & templates

| # | Feature | What it does | How it works (steps) | Source pages |
|---|---------|--------------|----------------------|--------------|
| 43 | Projects vs Artifacts | One project can hold several outputs that share one backend | A project is the container (files, database, services). An artifact is one output inside it: a web app, mobile app, data view, slide deck, video, or files. Artifacts in one project share the backend, database, and services. Switch between artifacts from the project view. | `features/projects-and-artifacts/artifacts.html`, `learn/projects-and-artifacts/projects-and-artifacts.html` |
| 44 | Web apps (artifact type) | Full-stack web apps built from a prompt | Type a prompt or pick "Web app" from the app-type dropdown; Agent scaffolds frontend + backend + database; responsive by default; publish in one click. | `features/artifact-types/web-apps.html` |
| 45 | Native mobile apps (artifact type) | iOS + Android apps from one codebase | Agent scaffolds a React Native + Expo app. Preview in the editor's iOS Simulator / Android Emulator (streamed, no local toolchain), or on a real phone via Expo Go (scan a QR code). Publish path: build in the editor, submit to TestFlight, promote to the App Store. Client (phone) + server (cloud backend, database, APIs) architecture. | `features/artifact-types/building-mobile-apps.html` |
| 46 | Data visualizations (artifact type) | Charts and dashboards from data | Create from the app-type dropdown or from chat; Agent builds interactive charts/dashboards backed by data or a database. | `features/artifact-types/data-apps.html` |
| 47 | Slide decks (artifact type) | Presentations generated from a prompt | Start from a prompt, brand guidelines, or a reference; iterate on the Design Canvas for variations; export the finished deck. | `features/artifact-types/slide-decks.html` |
| 48 | Animated videos (artifact type) | Short motion-graphics videos from a description | Describe the video in plain language; Agent builds scenes; iterate on timing and content; export the finished video. | `features/artifact-types/animated-videos.html` |
| 49 | Templates gallery | Start from a ready-made template instead of a blank prompt | Browse template cards (with screenshots, categories, search); pick one to open it as a new project; templates cover frameworks, app types, and use cases. | `replit.com/replspace-templates.html` (thin in mirror), `features/project-setup/developer-frameworks.html` |
| 50 | Remix (copy a public app) | Make your own copy of a public app or template | Open a public app, choose Remix; the copy includes its files and setup; build on it from there. | `features/projects-and-artifacts/remix-an-app.html` |
| 51 | Import (GitHub / Figma / Vercel / Lovable / Bolt) | Bring an existing project into Replit | Pick the source, connect the account or paste the URL, and Agent imports the code (or the Figma design) into a new project. | `replit.com/llms_txt.html` (quickstarts), `getting-started/quickstarts/import-from-vercel.html` |

### 1D. Data & storage

| # | Feature | What it does | How it works (steps) | Source pages |
|---|---------|--------------|----------------------|--------------|
| 52 | SQL Database (managed Postgres) | A built-in database for the app, with dev and production copies | Add a database from the Database tool (Overview: tables; My Data: browse/edit rows and run SQL; Monitoring: live and slow queries; Settings: connection string and usage). Development database for building; a production database is created at publish time. Time travel restores the dev database to a checkpoint. | `features/data-and-storage/sql-database.html`, `learn/projects-and-artifacts/storage-and-databases.html` |
| 53 | App Storage (object buckets) | File storage for uploads (images, video, documents) | Create a private bucket; upload files or whole folders (or drag and drop); organise in folders; download or delete objects; manage bucket permissions; access from code with the JavaScript/Python SDK or copy-paste snippets. | `features/data-and-storage/object-storage.html` |
| 54 | Key-value store | Simple persistent key/value data for small apps | A legacy store, documented alongside the SQL database; superseded by the SQL database for most uses. | `replit.com/llms_txt.html` (docs index) |
| 55 | Publish database changes (guided migration) | Moves schema/data changes safely from dev to production at publish time | 1. Replit detects the changes. 2. User answers questions about ambiguous changes. 3. Review the generated SQL. 4. Replit validates the migration. 5. Optionally preview the app on the migrated copy. 6. Approve and publish. Manual production edits are also possible. | `features/data-and-storage/publish-database-changes.html` |
| 56 | Data recovery & backups | Restores data after mistakes or corruption | Restore the dev database to a checkpoint; restore production to a point in time; schedule daily production backups. | `features/data-and-storage/data-recovery.html` |
| 57 | Database monitoring | Shows what the database is doing right now | Active queries list, slowest-query ranking, and per-query cost; production databases only. | `features/data-and-storage/monitor-your-database.html`, `features/data-and-storage/connection-details.html` |

### 1E. Auth for user apps

| # | Feature | What it does | How it works (steps) | Source pages |
|---|---------|--------------|----------------------|--------------|
| 58 | Replit Auth (zero-setup login) | Adds sign-in to an app with no configuration | Ask Agent to add it; the app gets a prebuilt login page, user list (name, last sign-in), secure sessions, and a customisable login screen (name, icon, providers, session secret). User data can be joined to the app's database. | `features/auth-and-identity/authentication.html`, `features/auth-and-identity/overview.html` |
| 59 | Clerk Auth (full-featured login) | A complete auth service for apps needing more control | Custom sign-in flows, own OAuth branding, providers (Google, GitHub, Apple, X) with the user's own OAuth credentials, domain setup for email verification, dev/prod environments. | `features/auth-and-identity/clerk-auth.html`, `features/auth-and-identity/sign-in-providers.html` |

### 1F. Publishing & live-app tooling

| # | Feature | What it does | How it works (steps) | Source pages |
|---|---------|--------------|----------------------|--------------|
| 60 | Publish flow (one panel) | Ships the app live with all settings in one place | Open Publishing: pick a domain (suggested name, availability checked) or connect a custom domain; choose who can access it; set database behaviour; turn on monitoring; run the security scan; turn on the feedback widget; pick a deployment type and machine configuration; secrets sync automatically; pick a hosting region. Then Publish; later updates republish, and releases are tracked. | `features/publishing/overview.html`, `features/publishing/after-you-publish.html` |
| 61 | Deployment types | Four ways to run a published app | Autoscale (scales with traffic, recommended for most apps), Static (static files), Reserved VM (always-on machine, e.g. bots), Scheduled (runs on a timetable). | `features/publishing/deployment-types.html`, `learn/projects-and-artifacts/replit-deployments.html` |
| 62 | Custom domains | Put the app on the user's own domain | Buy a new domain in Replit, or connect one already owned: add the DNS records Replit shows, Replit checks them over time, then the domain goes live; many subdomains can point at one domain. | `features/publishing/custom-domains.html` |
| 63 | Static deployment config | Fine control for static sites | Add response headers, a custom 404 page, and URL path rewrites. | `features/deployment-customization/static-deployments-advanced.html` |
| 64 | Access control for live apps | Limits who can open a published app | Public, password protected, workspace only, or invite only; changeable after publishing; invite lists are managed from the publish panel. | `features/publishing/private-deployments.html` |
| 65 | Monitoring (uptime, logs, alerts) | Watches a published app and tells the owner when it breaks | Uptime percentage with a history bar; scheduled health checks with email alerts on downtime; request/latency/error charts; infrastructure monitoring (CPU, memory, instances); runtime logs filterable by severity or deployment revision; performance scans. | `features/publishing/monitoring-a-deployment.html` |
| 66 | Monitoring Agent | An AI that investigates production alerts and fixes them | When an alert fires, ask Monitoring Agent about it in plain language ("why did my app return 500s in the last hour?"); it reads telemetry (traffic, latency percentiles, compute, storage, error logs), attempts a fix, validates it, and optionally republishes automatically. | `features/publishing/monitoring-agent.html` |
| 67 | Performance Agent | Finds and fixes speed problems in a published app | Start a scan from Monitoring; review what it found; apply fixes from the Monitoring page; republish to apply them. | `features/publishing/performance-agent.html` |
| 68 | SEO Agent + SEO Rating | Audits a published app for search visibility and fixes it | The Growth pane shows an SEO Rating; "Run scan with Agent" audits crawlability (robots.txt, sitemap, link structure), metadata (titles, descriptions), structured data (JSON-LD), social tags, and semantic markup; Agent applies one-click fixes. Works on published public apps. | `features/publishing/seo-agent.html`, `features/publishing/seo-rating.html` |
| 69 | Project Analytics | Usage stats for a published app, with AI Q&A | Default analytics open from the Growth pane; add custom events with Agent; ask Agent about the numbers in plain language. | `features/publishing/project-analytics.html` |
| 70 | Feedback widget | A feedback button on the published app | Turn it on in Publishing; choose position and appearance; submissions land in an inbox; send a submission to Agent to fix. Turn it off any time. | `features/publishing/feedback-widget.html` |

### 1G. Collaboration, workspaces & platforms

| # | Feature | What it does | How it works (steps) | Source pages |
|---|---------|--------------|----------------------|--------------|
| 71 | Workspaces (Personal vs Team) | Organise projects, teammates, settings, and access | A workspace selector at the top of navigation switches workspaces. The Workspace home shows recent projects, workspace navigation, and the chat prompt in one view. Personal workspaces are account-owned; team workspaces hold shared projects. | `features/collaboration/workspaces.html`, `features/collaboration/team-workspaces.html` |
| 72 | Team workspaces & access control | Shared spaces with roles and permissions | Create a team workspace, invite members, assign roles/groups, manage who can see and change each project; organisation controls include single sign-on, directory sync, viewer seats, and model controls. | `features/collaboration/team-workspaces.html`, `features/collaboration/enterprise-model-controls.html`, `features/collaboration/workspace-settings.html` |
| 73 | Chats (workspace AI chat) | A standing AI chat at workspace level, separate from any one project | Start a chat from the workspace home; ask questions, research, run routines, or describe an outcome; turn the result into a project, dashboard, or deck. | `features/chats-and-routines/chats.html` |
| 74 | Routines (scheduled work) | Recurring work that runs on a schedule and reports back in the same chat | Create a routine from a chat (what to do, how often); it runs automatically; results arrive in the same thread; if it needs attention, it asks; manage, pause, or delete from the routines list. | `features/chats-and-routines/routines.html`, `core-concepts/agent/agents-and-automations.html` |
| 75 | Sharing (chats & assets) | Share a chat or a single asset with the workspace or specific people | Choose who has access (workspace or individuals); stop sharing any time; access problems have a troubleshooting guide. | `features/chats-and-routines/sharing.html` |
| 76 | Mobile app (Replit on phone) | Build and edit on iOS/Android | Home screen has a prompt box and recent projects; navigate, chat with Agent, and edit on the go. | `features/platforms/mobile-app.html` |
| 77 | Desktop app | Replit as a native desktop app | Same workspace and editor in a desktop shell, with organisation features for teams. | `features/platforms/desktop-app.html` |
| 78 | ChatGPT / Claude / Slack surfaces | Use Replit from inside other tools | Replit works as a surface inside ChatGPT, Claude, and Slack (agents and integrations). | `features/platforms/chatgpt.html`, `features/platforms/claude.html`, `features/platforms/slack.html` (docs index) |

### 1H. Monetization (for apps users build)

| # | Feature | What it does | How it works (steps) | Source pages |
|---|---------|--------------|----------------------|--------------|
| 79 | Payments & subscriptions in user apps | Lets a built app take money | Ask Agent to add payments: Whop (sell digital products/memberships with almost no setup), Stripe (one-time payments, subscriptions, storefronts; sandbox first for testing), RevenueCat (in-app subscriptions for mobile apps, with a paywall screen and test mode). | `features/monetization/overview.html`, `core-concepts/monetization/stripe-payments.html` |

**Total inventoried: 79 features** (24 Agent + 18 workspace/editor + 9 projects/artifacts/templates + 6 data + 2 auth + 11 publishing + 8 collaboration/platforms + 1 monetization).

---

## 2. Frontend map (layout & key screens)

Reconstructed from the docs pages (the mirror's marketing pages are client-rendered shells, so
their exact pixels are not in the mirror; the structure below is what the docs describe).

### 2.1 Homepage / entry
- Top navigation with a workspace selector, and main sections: Projects, Chats, Routines.
- A large prompt box ("describe what you want to build") with an app-type dropdown
  (web app, mobile app, data visualisation, slide deck, animated video, files).
- Below: template/use-case cards, community gallery, and recent projects.
- Sign-in / create-account entry points; also available as desktop and mobile apps.

### 2.2 Workspace home
- Recent projects, workspace navigation, and the chat prompt in one view.
- Workspace selector at the top switches between Personal and Team workspaces.

### 2.3 Project Editor (the main workspace)
- **Left:** file tree (folders, files, drag a file into a pane to open; context menu:
  duplicate / rename / move / download / delete) + tools dock (Console, Shell, Git, Database,
  App Storage, Secrets, Security, Workflows).
- **Centre:** editor tabs for code; Agent chat ("Threads") beside it; Design Canvas as a
  separate surface.
- **Right:** Preview (live webview with back/forward, address field, screen-size presets,
  webview logs, open-in-new-tab) and Console below it.
- **Top:** Run button (runs the assigned workflow), search (command palette), options menu
  (pane/window/tab management), resources panel (compute/storage usage).
- Panes split horizontally/vertically, resize, rearrange, float, or pop out into new windows;
  several projects can be open at once.

### 2.4 Agent chat UI
- Prompt box at the bottom with: Plan toggle, capability-mode selector, model picker,
  Effort control, microphone (voice input), file attach, and send.
- The chat shows the plan, task list, progress, and results; a diff view for reviewing
  changes; Apply / Dismiss actions.
- Task board (Kanban): columns Drafts / Active / Ready / Done; cards with a three-dot menu
  (apply, review changes, rename, cancel); filters; auto-approve and auto-apply toggles.

### 2.5 Design Canvas
- Infinite board; frames (mockup, web app, mobile app, slides, image, video, vector);
  toolbar with Generate menu and library panel; Draw tool for sketches/arrows/sticky notes;
  right-click menu; the canvas stays linked to the live app.

### 2.6 Visual Editor
- Click any element in the canvas or Preview; a property panel appears with text editing,
  colour, alignment (3×3 picker), direction (row/column), gap, outer spacing (per side,
  lockable), inner spacing, and image swap (click to upload).

### 2.7 Publish panel
- One panel with sections: domain (suggested name + availability check), what is being
  published (preview + URL), who can access it, database settings, monitoring, security
  scan, feedback widget, deployment type, machine configuration, deployment secrets,
  hosting region, and a "block publishing on critical vulnerabilities" switch.
- After publishing: release list, update/republish flow, live-app management.

### 2.8 Templates gallery
- Cards with screenshots, names, categories, and search; opening a card starts a new
  project from that template; public apps have a Remix button.

### 2.9 Settings / Profile
- Three levels: Workspace settings (members, model controls, agent customisation, privacy,
  deployment), Account settings, and User settings (theme, keybindings, editor prefs).
- A usage overview sits in Settings; a Growth pane holds the SEO rating, analytics,
  and feedback inbox.

### 2.10 Data tools
- Database tool: landing list of databases → Overview (tables) / My Data (browse, edit,
  run SQL) / Monitoring (live + slow queries) / Settings (connection string, usage).
- App Storage tool: bucket picker → Objects (upload/download, folders, delete) / Commands
  (copy-paste SDK snippets per language) / Settings (permissions, delete bucket).

### 2.11 Monitoring / Growth screens
- Monitoring: uptime bar with history, alerts list (Active / Resolved), request/latency/
  error charts, compute and storage charts, logs.
- Growth pane: SEO Rating card with "Run scan with Agent", analytics charts, feedback inbox.

### 2.12 Mobile app
- Home: prompt box + recent projects; project view with chat and editor adapted to phone;
  Expo Go integration for testing native apps on a real device.

---

## 3. Docs summary per major feature

**Agent loop.** Everything starts from a plain-language prompt. Agent plans, writes code,
installs packages, runs the app, and shows it live. The user reviews, gives focused
follow-ups, and publishes. Good practice from the guides: be specific, plan the work,
add context (files, screenshots, canvas notes), review and test after each change, and use
checkpoints instead of untangling a bad change. The loop is: prompt → plan → build →
preview → review → fix → publish.

**Plan Mode & tasks.** Plan Mode is a no-code-change discussion that ends in an ordered,
reviewable task list; approving it starts the build (same session or background). The task
system runs those tasks in the background, each with a lifecycle (Draft → Active → Queued →
Ready → Applying → Done); nothing lands in the main version until the user applies it.
Parallel building works when tasks are sliced small and touch different areas; tasks that
touch the same screen should stay sequential.

**App Testing.** Agent drives the built app in a real browser, clicks through flows, enters
mock data, and checks UI, functionality, integrations, speed, and accessibility. Results
come back as a summary with a video replay and section navigation; issues are auto-fixed.
Testing can be skipped.

**Skills & customisation.** Skills are named instruction packs (name, when-to-use
description, steps) that Agent loads when relevant. Custom instructions are always-on
workspace defaults. A `replit.md` file in the project root carries per-project conventions.
Skills can be shared workspace-wide or imported from a public GitHub URL.

**Editor & preview.** A multi-pane editor (file tree, code tabs, tools dock, Preview,
Console, Shell) with a Run button wired to workflows. Preview is a live webview with
device presets and logs. The Visual Editor edits text/colour/layout by clicking, applying
simple changes straight to source without an Agent round-trip.

**Version control.** Two layers: automatic Agent checkpoints (full snapshot — files,
packages, config, AI context, and optionally database contents — with AI-written
descriptions, preview-before-restore, roll forward/back, and a matching Git commit) and
manual Git (pane + Shell: stage, commit, branches, push/pull, conflict resolution,
GitHub). File History adds per-file versions with compare, restore, and playback.

**Publishing.** One panel covers domain, access, database, monitoring, security, feedback,
deployment type, machine size, secrets, and region. Four deployment types fit different
shapes (scaling web apps, static sites, always-on services, scheduled jobs). After
publishing, releases are tracked and updates republish. Custom domains are bought or
connected with guided DNS checks; static sites get headers, custom 404s, and rewrites.

**Live-app agents.** Monitoring watches uptime and errors and emails on downtime.
Monitoring Agent reads production telemetry and can attempt and validate a fix, then
republish. Performance Agent scans for speed issues. SEO Agent audits crawlability,
metadata, structured data, and social tags and applies one-click fixes; the SEO Rating
scores the result. Project Analytics shows default metrics plus custom events, and Agent
can answer questions about them. The feedback widget collects user feedback on the live
app into an inbox that can be sent to Agent as fix tasks.

**Data.** A managed SQL database with separate development and production copies, a
browser-based tool for tables/rows/queries/monitoring, time-travel restore to a
checkpoint, point-in-time production restore, and daily backups. Publishing a schema
change runs a guided six-step migration (detect → clarify → review SQL → validate →
preview on a migrated copy → approve). App Storage holds user-uploaded files in private
buckets with SDKs. A legacy key-value store exists for small uses.

**Auth for user apps.** Two paths: a zero-setup built-in login (prebuilt login page,
user list, sessions, customisable screen) or a full-featured auth service with custom
flows, own OAuth branding, and providers (Google, GitHub, Apple, X) using the builder's
own OAuth credentials.

**Collaboration.** Workspaces separate personal and team work. Team workspaces add
members, roles, groups, and organisation controls. Chats are workspace-level AI
conversations; Routines schedule recurring work from a chat and report results back in
the same thread. Chats and assets can be shared with the workspace or individuals.

**Security.** Defence in layers: install-time package firewall, automatic dependency
scans with Agent-prepared patches, pre-publish Security Agent audits (three levels),
project and workspace security centres, and an option to block publishing when critical
findings exist. A security checklist covers front-end, back-end, and ongoing habits.

**Monetization & integrations.** Payments are added by asking Agent: one path for digital
products/memberships, one for card payments and subscriptions (sandbox first), one for
in-app mobile subscriptions (paywall screen, test mode). Integrations connect 70+ services
(workspace tools, code hosts, CRMs, payments, data warehouses, social) that Agent reads
and writes from chat; custom connectors cover APIs outside the library.

**Platforms & artifacts.** One project can produce a web app, a native mobile app
(React Native + Expo, simulators in the editor, Expo Go on a real phone, TestFlight/App
Store submission), a data dashboard, a slide deck, an animated video, or files — all
sharing one backend. Templates and Remix give starting points; imports bring in GitHub,
Figma, Vercel, Lovable, and Bolt projects. The same workspace is available on web,
desktop, and mobile, and inside ChatGPT, Claude, and Slack.

---

## 4. Mapping to OUR builder (Website and App Builder)

Our stack: one static single-HTML-file app + Supabase backend (tables: profiles, projects,
project_files, checkpoints, published_sites, skills; Auth email + Google + GitHub; RLS
owner-only). Already have: three-pane editor (index.html / styles.css / script.js), live
preview, "Describe it" Gemini generator, edit-on-preview inspector, 6 built-in skill packs +
custom skills, Tools & Plugins, Publish panel (Vercel / Netlify / Cloudflare Pages / GitHub /
Render), project library, History with versions/checkpoints, device toggle, login/accounts,
Profile, Settings. Hard rules: no pricing content anywhere; never present a feature as
working when it has no working functionality behind it.

Status key: **HAVE** = already in the builder · **FEASIBLE** = buildable in our stack ·
**LITE** = a smaller honest version is buildable · **NO** = not feasible in our stack.

| Replit feature | Status | How (if feasible) / why not | Priority |
|---|---|---|---|
| Agent plain-language builder | HAVE | "Describe it" generator (Gemini key in Settings) | — |
| Plan Mode | FEASIBLE | Planning chat that outputs an ordered task list; user approves, revises, or discards; approved plan becomes build steps | P1 |
| Build Mode (direct code change) | HAVE | Manual code tabs + generator edits | — |
| Capability modes / model picker / Effort | FEASIBLE | Settings: pick Gemini model + temperature; "Auto" picks per task | P2 |
| Task system / Task board | FEASIBLE | New Supabase `tasks` table; Kanban (Draft / Active / Ready / Done); Apply / Dismiss per task; auto-apply toggle | P1 |
| Follow-up task suggestions | FEASIBLE | After each generation, Gemini suggests 2–3 next steps as clickable chips | P2 |
| Steer & queue messages | FEASIBLE | Chat UI: queue prompts while generating; stop button cancels the current generation | P2 |
| App Testing (real-browser self-test) | LITE | Full version NO (needs a cloud browser runner). Lite: in-preview checks — console errors from the preview iframe, broken links/images, missing alt text, basic HTML validation | P1 |
| Agent Skills (built-in + custom) | HAVE | 6 packs + custom skills with import/export | — |
| Agent Customization (workspace instructions) | FEASIBLE | Per-account "always-on instructions" field, prepended to every generator prompt | P2 |
| replit.md project context | FEASIBLE | Per-project instructions file the generator always reads (a "Project brief" tab) | P1 |
| Web Search grounding | LITE | Search API wired into the generator where available; otherwise Gemini's own knowledge with a clear "unverified" label | P3 |
| Voice Mode | FEASIBLE | Browser Web Speech API: mic button in the prompt box, transcript lands in the box for review before sending | P3 |
| Image generation in Agent | HAVE | AI image plugin exists; wire it into the generator flow (ask for images as part of a build) | P2 |
| Audio generation | NO | No audio pipeline in a static builder; voiceover needs an external tool | — |
| Charts in chat | FEASIBLE | Paste data → Gemini generates a chart page (bar/line/donut) as an artifact | P2 |
| General Agent / workspace chat | FEASIBLE | A workspace-level Gemini chat column, separate from per-project generation (ask, research, plan) | P2 |
| Design Canvas | FEASIBLE | A static canvas board in the builder: frames, notes, arrows; generate mockup images for frames; notes feed the generator | P1 |
| Visual Editor (click-to-edit) | HAVE + FEASIBLE | Inspector exists; upgrade it with Replit-style controls: alignment picker, direction, gap, padding/margin inputs, colour, image swap | P1 |
| Agentic commerce | NO | Out of scope; a builder does not buy things | — |
| MCP | NO | Needs a server to host tools; a static client cannot serve MCP | — |
| Connectors / integrations (70+ services) | HAVE (partial) | Plugin catalogue exists; grow it with guided setup per service (keys stay in the user's browser) | P2 |
| Custom connectors | LITE | Custom plugin entries: endpoint + key, browser-stored; generator can call them from generated code | P3 |
| Open in Replit (import from URL) | LITE | Import a public page/ZIP into a new project; full repo import needs a host API | P3 |
| Project Editor shell | HAVE | Three-pane editor + tabs + preview | — |
| File tree (multi-file) | FEASIBLE | Extend the 3 fixed files to a real file tree (add/rename/delete files) backed by `project_files` | P1 |
| Preview (live webview) | HAVE | Live preview + device toggle | — |
| Console (app logs) | LITE | Capture the preview iframe's console errors into a log panel | P2 |
| Shell / terminal | NO | No code execution in a static app | — |
| Workflows / Run button | LITE | No execution; "Run" = refresh preview + run in-preview checks | P3 |
| CLUI | NO | No CLI to wrap | — |
| Keyboard shortcuts / Cmd+K palette | FEASIBLE | Pure frontend: command palette + shortcuts list | P2 |
| Multiplayer (live co-editing) | NO | Needs realtime collaborative editing; too large for a single-file static app | — |
| Git pane | LITE | Commit/push project files to GitHub via API with the user's token; no local git, no branches UI | P2 |
| File History | FEASIBLE | `project_files` already versions content; add a per-file history view with compare + restore | P2 |
| Secrets (env vars) | HAVE + FEASIBLE | Publish tokens already browser-stored; add per-project env vars in Supabase with an honest note (not encrypted at rest — not for production secrets) | P2 |
| Security tooling (firewall/scans/agent) | LITE | No AI audit possible; static checks are feasible: hardcoded keys, mixed content, missing alt, broken links | P3 |
| Dependency management | N/A | Static HTML/CSS/JS has no packages; nothing to build | — |
| Ports & networking | N/A | Static sites have no ports | — |
| Project config files | LITE | A project settings record: name, description, publish target, custom head code, favicon | P2 |
| Extensions API / marketplace | HAVE (basic) | Custom plugins exist; a full extension runtime is out of scope | — |
| User settings & themes | HAVE | Settings screen + theme | — |
| Multi-artifact projects | FEASIBLE | Artifact switcher inside a project (`project_files` already holds many files); one project can hold a site + slides + data view sharing the same data | P1 |
| Web apps (artifact type) | HAVE | The generator builds them | — |
| Native mobile apps | LITE | Full native builds NO (needs native build infra). Lite: PWA export — manifest + service worker + install prompt, so a generated site installs like an app | P2 |
| Data visualizations (artifact) | FEASIBLE | Chart/dashboard artifact type generated from pasted data | P2 |
| Slide decks (artifact) | FEASIBLE | HTML slide-deck artifact type (present + export) | P2 |
| Animated videos (artifact) | NO | Needs a render pipeline; cannot run in a static builder | — |
| Templates gallery | FEASIBLE | Built-in starter templates stored as project files; one click creates a project from a template | P1 |
| Remix (copy a public app) | FEASIBLE | Duplicate any project (own or shared file); import a shared project file | P2 |
| Import GitHub / Figma / Vercel / Lovable / Bolt | LITE | GitHub public-repo fetch is feasible; Figma import NO (needs Figma API + a design parser) | P3 |
| SQL Database for user apps | FEASIBLE | Guided Supabase tables per project: a simple table editor (create table, add rows) backed by Supabase with RLS; honest scope — one shared project database, not a full Postgres console | P1 |
| App Storage (file uploads) | FEASIBLE | Supabase Storage `project-assets` bucket + upload UI; generated sites reference the files | P1 |
| Key-value store | FEASIBLE | A simple rows table for small app data | P3 |
| Guided DB migration on publish | NO | No migration runner in a static publish flow | — |
| Data recovery / backups | FEASIBLE | Project export (JSON/ZIP) + restore; checkpoints already give point-in-time restore | P2 |
| DB monitoring | NO | Static sites generate no live database traffic to watch | — |
| Replit Auth (login for user apps) | FEASIBLE | Generator emits a Supabase Auth login page + setup guide using the project's own Supabase project | P1 |
| Clerk Auth (login for user apps) | LITE | Generator emits a Clerk snippet + setup guide; user brings their own keys | P3 |
| Publish flow panel | HAVE + FEASIBLE | Panel exists; upgrade it into a Replit-style guided checklist (domain → access → checks → publish) | P2 |
| Deployment types (Autoscale/VM/Scheduled) | NO | Static only; server deployments need a backend host | — |
| Custom domains | LITE | Guided DNS checklist for Cloudflare Pages custom domains (already proven with elhir.com); not automated | P2 |
| Static deployment config | FEASIBLE | Emit `_headers`, `_redirects`, and `404.html` for Cloudflare Pages at publish time | P2 |
| Access control for live apps | LITE | Client-side password-gate page; label honestly (not real security) | P3 |
| Monitoring uptime/logs | LITE | A scheduled check that pings the published URL and logs status to Supabase; no live log tail | P3 |
| Monitoring Agent (AI fix loop) | NO | Needs a server, repo access, and republish automation | — |
| Performance Agent | LITE | Static audit: page weight, image sizes, render-blocking resources; checklist + fixes | P3 |
| SEO Agent + Rating | FEASIBLE | Audit generated HTML (titles, meta, sitemap, robots, OG tags, headings, alt); score + one-click fixes; emit sitemap.xml/robots.txt at publish | P1 |
| Project Analytics | LITE | Plausible/GA plugin exists; add an analytics setup wizard; a builder-side dashboard needs the provider's API, so link out honestly | P3 |
| Feedback widget | FEASIBLE | Small JS snippet for published sites that posts to a Supabase `feedback` table; inbox inside the builder with "send to generator" | P1 |
| Workspaces Personal vs Team | HAVE (partial) | Accounts with separate projects exist; team sharing is LITE only (view-only share link) | — |
| Team roles / SSO / SCIM | NO | Out of scope for a personal builder | — |
| Chats (workspace AI chat) | FEASIBLE | Same as General Agent row above | P2 |
| Routines (scheduled work) | NO | Needs an always-on runner; a reminder is not the feature | — |
| Sharing | LITE | Share a project as a view-only link or an export file | P2 |
| Mobile app (builder on phone) | LITE | The builder is already a responsive web app; a native wrapper is out of scope | — |
| Desktop app | NO | Needs native packaging (Electron/Tauri) | — |
| ChatGPT / Claude / Slack surfaces | NO | Needs platform integrations | — |
| Monetization (Stripe/Razorpay in user apps) | HAVE (partial) | Plugins exist; generator emits checkout/payment page snippets + setup guide | P2 |

Counts: **HAVE 13** (incl. partials) · **FEASIBLE 22** · **LITE 19** · **NO 13** · **N/A 2**.

---

## 5. Top 10 to build first

Prioritised by value to someone building websites/apps in our builder, and by fit with the
static + Supabase stack. Each is feasible without a server.

1. **Plan Mode** — a planning chat that returns an ordered, reviewable task list; approve
   → build. It is the single biggest quality jump: fewer wasted generations, clearer intent.
2. **Task board** — Kanban (Draft / Active / Ready / Done) for build steps, wired to
   checkpoints; Apply / Dismiss per task. Turns generation into manageable work.
3. **Templates gallery** — one-click starters (landing page, portfolio, shop, dashboard,
   blog). The fastest way for a new user to get something good.
4. **Visual Editor upgrade** — real layout controls in the inspector (alignment, gap,
   padding/margin, colour, image swap) that write CSS directly. Makes the builder feel
   like a design tool, not a code box.
5. **Multi-artifact projects** — one project holding a site + slides + data view, with an
   artifact switcher. Matches how people actually use a builder.
6. **Supabase data for user apps** — simple table editor + App Storage uploads, so
   generated sites can store real data and files instead of only static content.
7. **SEO helper** — audit + score + one-click fixes, and emit sitemap.xml / robots.txt at
   publish. Directly helps the sites people ship get found.
8. **In-preview checks ("self-check")** — console errors, broken links/images, missing alt
   text, page weight, run on every preview refresh. The honest, buildable slice of App
   Testing.
9. **Feedback widget** — snippet + Supabase inbox inside the builder, with "send to
   generator". Closes the loop between a published site and the next improvement.
10. **Project brief (replit.md equivalent) + custom instructions** — per-project context
    the generator always reads, plus per-account always-on instructions. Cheap to build,
    big quality gain across every generation.

Honourable mentions for the next round: model picker, follow-up suggestions, steer/queue,
file tree (multi-file projects), PWA export, slide-deck + chart artifact types, Replit-Auth-style
login page generation, static deployment config files, GitHub commit/push.

---

## 6. What the mirror could not show (honest gaps)

- The marketing homepage, templates gallery, and community pages are client-rendered
  shells in the mirror, so their exact layout, copy, and visuals were not studied here.
- Multiplayer, the desktop/mobile apps, and the extension marketplace are documented but
  thin in the mirror; their descriptions above come from the docs index and headings.
- Anything about how Replit's backend runs (runtimes, autoscaling, internal operations) is
  outside a public-site mirror and was not studied.
- This report describes Replit's *documented behaviour*, not a live test of Replit itself.

*Study completed 18 Nov 2026 from `replit.com.zip` (mirror of the public site). All
descriptions are original summaries of function and structure; no Replit copy, images, or
assets were reproduced.*
