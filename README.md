# Expense Tracker

A private, password-protected money dashboard that replaces the "Big Expense
Tracker" spreadsheet. Single-user login, Next.js + Supabase, deployable to
Vercel with a real URL that stays in sync across every device you log in
from. This is a standalone app — it shares nothing with any other project in
this repository.

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
   This creates the tables with row-level security enabled and no policies —
   meaning only requests using the **service role key** (or the newer
   **secret key**, same thing functionally) can read or write, which is
   exactly what this app's server code uses.
3. Optional: run [`supabase/seed.sql`](./supabase/seed.sql) to import the
   data from the original spreadsheet (all logged expenses, the investment
   history, the standing debts, and the monthly savings progress) so the app
   starts populated instead of empty. Skip it to start from scratch.
4. From **Project Settings → API Keys**, grab:
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

1. Import this repository into [Vercel](https://vercel.com/new), pointing
   at this branch.
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
- "Log out" is in the top nav on every page.

## Data model

`expense_entries`: one row per line item in the monthly expense table —
`month`, `date_label` (e.g. `"1st"`), `name`, `amount`, and `category`
(`recurring` / `stoppable` / `installment` / `debt` / `one_off`, matching
the sheet's color-coded legend).

`monthly_income`: declared income for a given `month` (defaults to 15000,
same as the sheet).

`investment_months`: one row per month of investing — `contribution` (money
added that month) and `portfolio_value_eom` (nullable until you know it).
Total invested, portfolio growth, P&L %, and $ P&L are all computed from
these on read, never stored, so they can't drift out of sync — same
approach the original spreadsheet's formulas used.

`debts`: standing debts, `name` + `amount` (negative = owed, matching the
sheet's sign convention; a debt that's been overpaid ends up positive).

`savings_months`: one row per month of debt paydown / saving — `debt_paydown`,
`big_payment` (an occasional lump sum, can be negative), `savings_kept`, and
`money_kept`. Debt-left, cumulative total savings, and account total are all
computed by walking the months in order (each month's debt-left carries into
the next month's starting balance), mirroring the running formulas in the
sheet's Savings Tracker tab.

If you're updating from an earlier deploy, re-run `supabase/schema.sql` in
the Supabase SQL editor — every statement in it is idempotent and safe to
re-run against an existing database.

## Pages

- **Overview** (`/`) — the current month's income/spend/leftover, the
  latest investment snapshot, and the latest savings/debt snapshot, each
  linking into its full page.
- **Expenses** (`/expenses`) — one month at a time (prev/next nav), with an
  editable income figure, every expense entry color-coded by category, and
  inline add/edit/delete.
- **Investments** (`/investments`) — every logged month in one table:
  contribution, running total invested, portfolio value, P&L %, and $ P&L,
  with inline add/edit/delete. Leave portfolio value blank for a month you
  don't know yet — that month's growth/P&L just shows a dash instead of a
  divide-by-zero error like the original sheet had.
- **Savings & debt** (`/savings`) — your standing debts (with a running
  total) and the month-by-month savings table (debt paydown, debt left,
  savings kept, running total savings, account total), with inline
  add/edit/delete on both.
