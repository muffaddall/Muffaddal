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

### 1. Create the Supabase project and table

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run everything in [`supabase/schema.sql`](./supabase/schema.sql).
   This creates the `posts` table with row-level security enabled and no
   policies — meaning only requests using the **service role key** can read
   or write, which is exactly what this app's server code uses.
3. From **Project Settings → API**, grab:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (never expose
     this to the browser — it's only read on the server in this app)

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
- There's a "Log out" link at the bottom of the Month view.

## Data model

Each row in `posts` has `name`, `shoot_date`, `edit_date`, `post_date`,
`type` (Reel / Carousel / Static Post / Story / Other), `idea`, and
`inspiration`. A post can appear on three different calendar days at once
(its shoot/edit/post dates), which is what the Day view's three sections,
the Week view's per-day dots, and the Month view's colored dots are all
built around.

## Views

- **Day** (`/`) — the default landing page. Today's Shoot/Edit/Post sections.
- **Week** (`/week`) — a 7-day agenda list with role-colored dots per day.
- **Month** (`/month`) — a calendar grid with colored dots per day.

Adding or editing a post uses a single-page form (`/add`, `/edit/[id]`) with
all fields — name, three dates, format, idea, inspiration — visible at once.
