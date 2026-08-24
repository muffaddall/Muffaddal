# Content Pipeline

A private, password-protected content planning tool for Instagram / YouTube
Shorts / TikTok. Single-user login, Next.js + Supabase, deployable to Vercel
with a real URL that stays in sync across every device you log in from.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Supabase** (Postgres) for storage, accessed only server-side with the
  service role key — there's no per-row auth, the whole app is gated by the
  single password
- Session cookie signed with **jose** (HS256 JWT), checked on every request
  by `src/proxy.ts` (Next 16 renamed `middleware.ts` to `proxy.ts`)

## One-time setup

### 1. Create the Supabase project and tables

1. Create a project at [supabase.com](https://supabase.com). Pick a region
   close to wherever you'll deploy on Vercel — see the latency note below.
2. Open the SQL editor and run everything in [`supabase/schema.sql`](./supabase/schema.sql).
   This creates the `posts` and `groups` tables with row-level security
   enabled and no policies — meaning only requests using the **service
   role key** (or the newer **secret key**, same thing functionally) can
   read or write, which is exactly what this app's server code uses.
3. From **Project Settings → API Keys**, grab:
   - `Project URL` → `SUPABASE_URL`
   - the **secret key** (or `service_role` key on older projects) →
     `SUPABASE_SERVICE_ROLE_KEY` (never expose this to the browser — it's
     only read on the server in this app)

### 2. Choose your password and a session secret

- `SITE_PASSWORD` — whatever password you want to type to get in.
- `AUTH_SECRET` — a long random string used to sign the session cookie.
  Generate one with:
  ```bash
  openssl rand -base64 32
  ```

### 3. Deploy to Vercel

1. Import this repository into [Vercel](https://vercel.com/new).
2. Add these environment variables in the project settings:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SITE_PASSWORD`
   - `AUTH_SECRET`
3. Deploy. You'll get a real `https://your-project.vercel.app` URL — bookmark
   it, open it on any device, and log in with `SITE_PASSWORD`. Data is
   stored in Supabase, so it's the same across every device/browser you log
   into.

### Latency

Every page here talks to Supabase, so the physical distance between where
your Vercel function runs and where your Supabase project lives shows up
directly as page-load time. `vercel.json` pins Vercel's function region to
`sin1` (Singapore) — update it to whatever region is closest to your
Supabase project's region (shown on its dashboard overview) if you picked
somewhere else. On Vercel's Hobby plan you can only pick one region; check
**Project Settings → Functions → Function Region** matches too.

## Local development

```bash
cp .env.example .env.local   # fill in the four values above
npm install
npm run dev
```

## How access works

- `src/proxy.ts` runs before every request. If there's no valid signed
  session cookie, it redirects to `/login`.
- `/login` is a password-only form (no username/signup) that compares the
  submitted password to `SITE_PASSWORD` with a constant-time comparison,
  then sets an httpOnly session cookie good for 180 days.
- "Log out" is in the hamburger menu (top-left on every page).

## Data model

`posts`: `name`, `shoot_date`/`edit_date`/`post_date` (all nullable —
null means the idea hasn't been scheduled yet), `type` (Reel / Carousel /
Static Post / Story / Other), `idea`, `inspiration`, a notes field per date
(`shoot_notes`/`edit_notes`/`post_notes`), and `group_id` (nullable,
references `groups`).

`groups`: just `id` and `name` — a lightweight way to bundle a series of
ideas together (e.g. a multi-part series).

A post is considered **scheduled** once all three dates are set (the app
enforces all-or-nothing — either none of the dates are set, or all three
are). Scheduled posts are what show up in Content Schedule's Day/Week/Month
views; everything (scheduled or not) shows up in the Idea Vault.

If you're updating from an earlier deploy, re-run `supabase/schema.sql` in
the Supabase SQL editor — every statement in it is idempotent and safe to
re-run against an existing database.

## Pages

- **Home** (`/`) — the default landing page. A welcome message, a
  quick "+ New Idea" button, and today's Shoot/Edit/Post sections.
- **Content Schedule** (`/schedule/day`, `/schedule/week`, `/schedule/month`)
  — reachable from the hamburger menu. Only shows *scheduled* ideas.
  - **Day** — same three-section view as Home, with prev/next/today nav.
  - **Week** — a 7-day list showing each post's name and role (Shoot/Edit/Post).
  - **Month** — a calendar grid with colored dots per day.
- **Posting Schedule** (`/posting-schedule`) — a week-at-a-time view of just
  posting dates and times (no shoot/edit clutter), one week per screen with
  prev/next navigation, posts listed in chronological order by time within
  each day.
- **Idea Vault** (`/vault`) — every idea, scheduled or not, organized into
  groups. `/vault/group/[id]` and `/vault/ungrouped` each split into a
  "Not scheduled" section (with a "Schedule" button per idea) and a
  "Scheduled" section.

**New Idea** (`/new-idea`) is a two-phase flow:
1. Capture: idea name, type of post, optional inspiration, optional group
   (pick an existing one or create a new one inline).
2. Either **Save without scheduling** (goes straight to the Idea Vault, into
   whichever group you picked) or **Schedule**, which reveals the three
   dates — each with its own optional notes field, plus a posting **time**
   next to the posting date (used by the Posting Schedule page) — and
   **Save & schedule**, which makes the idea show up in Content Schedule too.

Editing an idea (`/edit/[id]`) reopens the same form pre-filled, with a
"Delete" option. Saving or deleting returns you to wherever you opened the
form from.
