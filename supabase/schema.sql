-- Run this in your Supabase project's SQL editor.
-- Safe to re-run any time you pull an update that adds columns/tables —
-- every statement here is idempotent.

create extension if not exists "pgcrypto";

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table groups enable row level security;

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  shoot_date date,
  edit_date date,
  post_date date,
  post_time time,
  type text not null check (type in ('Reel', 'Carousel', 'Static Post', 'Story', 'Other')),
  idea text not null default '',
  inspiration text,
  shoot_notes text,
  edit_notes text,
  post_notes text,
  group_id uuid references groups(id) on delete set null,
  posted_tiktok boolean not null default false,
  posted_youtube boolean not null default false,
  posted_instagram boolean not null default false,
  target_tiktok boolean not null default true,
  target_youtube boolean not null default true,
  target_instagram boolean not null default true,
  shot_done boolean not null default false,
  edited_done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Adds/relaxes these if you're re-running this against a table created
-- before ideas could be unscheduled or grouped.
alter table posts add column if not exists shoot_notes text;
alter table posts add column if not exists edit_notes text;
alter table posts add column if not exists post_notes text;
alter table posts add column if not exists group_id uuid references groups(id) on delete set null;
alter table posts add column if not exists post_time time;
alter table posts add column if not exists posted_tiktok boolean not null default false;
alter table posts add column if not exists posted_youtube boolean not null default false;
alter table posts add column if not exists posted_instagram boolean not null default false;
-- Which platforms this idea is meant to go out to — defaults to "all three"
-- so existing ideas behave the same as before this column existed (fully
-- posted = every one of TikTok/YouTube/Instagram marked posted).
alter table posts add column if not exists target_tiktok boolean not null default true;
alter table posts add column if not exists target_youtube boolean not null default true;
alter table posts add column if not exists target_instagram boolean not null default true;
alter table posts add column if not exists shot_done boolean not null default false;
alter table posts add column if not exists edited_done boolean not null default false;
alter table posts alter column shoot_date drop not null;
alter table posts alter column edit_date drop not null;
alter table posts alter column post_date drop not null;

create index if not exists posts_shoot_date_idx on posts (shoot_date);
create index if not exists posts_edit_date_idx on posts (edit_date);
create index if not exists posts_post_date_idx on posts (post_date);
create index if not exists posts_group_id_idx on posts (group_id);

-- Row Level Security is left enabled with no policies, so only requests
-- using the service role key (server-side only, never exposed to the
-- browser) can read or write. The app's own password gate is what
-- protects access to that server code.
alter table posts enable row level security;

-- ---- Money section (expenses / investments / savings) ----

-- One row per expense line item, scoped to the first-of-month it belongs to.
create table if not exists expense_entries (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  date_label text not null default '1st',
  name text not null,
  amount numeric not null default 0,
  category text not null default 'recurring'
    check (category in ('recurring', 'stoppable', 'installment', 'debt', 'investment', 'savings', 'one_off')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists expense_entries_month_idx on expense_entries (month);

alter table expense_entries enable row level security;

-- Widens the category check for installs that already had this table (the
-- create table above only applies to a fresh table). Re-run any time this
-- list grows.
alter table expense_entries drop constraint if exists expense_entries_category_check;
alter table expense_entries add constraint expense_entries_category_check
  check (category in ('recurring', 'stoppable', 'installment', 'debt', 'investment', 'savings', 'one_off'));

-- Whether this planned expense has actually been paid yet — lets the
-- Day-to-Day page show an "Actual Balance" (only paid entries deducted)
-- alongside the optimistic "Planned Balance" (every entry deducted).
alter table expense_entries add column if not exists paid boolean not null default false;

-- Declared monthly income, one row per month (defaults to 15000 like the
-- sheet). Made per-account further down, once the accounts table exists.
create table if not exists monthly_income (
  month date primary key,
  income numeric not null default 15000
);

alter table monthly_income enable row level security;

-- One row per month of investing: money added that month, and the portfolio's
-- value at end-of-month once known (null until you fill it in).
create table if not exists investment_months (
  month date primary key,
  contribution numeric not null default 0,
  portfolio_value_eom numeric,
  created_at timestamptz not null default now()
);

alter table investment_months enable row level security;

-- Small key/value store for app-wide settings — the AED-per-USD rate used to
-- convert "Investment funding" expense entries (in AED) into the USD
-- contribution figures on the Investments tab, plus AED-per-GBP and
-- AED-per-INR used on the Net Worth tab to combine UK/India account
-- balances into one AED total. All editable in case you want to reflect the
-- slightly different rate your bank/broker actually applies.
create table if not exists app_settings (
  key text primary key,
  value numeric not null
);

alter table app_settings enable row level security;

insert into app_settings (key, value) values ('aed_per_usd', 3.6725)
on conflict (key) do nothing;

insert into app_settings (key, value) values ('aed_per_gbp', 4.65)
on conflict (key) do nothing;

insert into app_settings (key, value) values ('aed_per_inr', 0.044)
on conflict (key) do nothing;

-- Purchases made using money from the Big Purchase Fund. Their total is
-- subtracted from the fund's running balance. (Replaces the old "debts"
-- table — those are the same thing: things bought using the fund.)
create table if not exists bpf_purchases (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table bpf_purchases enable row level security;

-- Impromptu / one-off money from anywhere, added straight to Savings or
-- the Big Purchase Fund on your own call — not tied to a month, unlike
-- the recurring Planned Expenses categories that normally feed these
-- totals.
create table if not exists money_influxes (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  amount numeric not null default 0,
  destination text not null default 'savings' check (destination in ('savings', 'bpf')),
  created_at timestamptz not null default now()
);

alter table money_influxes enable row level security;

-- Monthly debt paydown + savings progress. Running balances (debt left, total
-- savings, account total) are computed from these month-over-month, not stored.
create table if not exists savings_months (
  month date primary key,
  debt_paydown numeric not null default 0,
  big_payment numeric not null default 0,
  savings_kept numeric not null default 0,
  money_kept numeric not null default 50000,
  created_at timestamptz not null default now()
);

alter table savings_months enable row level security;

-- ---- Fitness section (calorie + weight tracking) ----

-- One row per day. Intake/net/deficit-or-surplus are computed on read from
-- these four meal fields plus calories burned, never stored redundantly.
create table if not exists calorie_logs (
  date date primary key,
  breakfast numeric not null default 0,
  lunch numeric not null default 0,
  dinner numeric not null default 0,
  snacks numeric not null default 0,
  burned numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Water intake in ml, tracked alongside the meals (goal is 3000ml/day —
-- see WATER_GOAL_ML in src/lib/types.ts).
alter table calorie_logs add column if not exists water numeric not null default 0;

alter table calorie_logs enable row level security;

-- Manually logged weight entries — as many or as few per day as you like.
create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time time,
  weight numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists weight_logs_date_idx on weight_logs (date);

alter table weight_logs enable row level security;

-- Workout entries across the three tracked disciplines. Pace, personal
-- best, and average pace are all computed on read from distance/duration,
-- never stored redundantly.
create table if not exists workout_logs (
  id uuid primary key default gen_random_uuid(),
  discipline text not null check (discipline in ('running', 'cycling', 'swimming')),
  date date not null,
  time time,
  distance numeric not null,
  duration_min numeric not null,
  created_at timestamptz not null default now()
);

-- Renamed from distance_km — swimming logs meters, not km, so the column
-- is unit-agnostic; the app knows which unit each discipline uses.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'workout_logs' and column_name = 'distance_km'
  ) then
    alter table workout_logs rename column distance_km to distance;
  end if;
end $$;

create index if not exists workout_logs_discipline_idx on workout_logs (discipline);
create index if not exists workout_logs_date_idx on workout_logs (date);

alter table workout_logs enable row level security;

-- ---- Day-to-day expenses (separate from the "Planned Expenses" tab) ----

-- One row per bank account you actually hold money in. Balances are never
-- stored — always computed on read from transactions.
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'AED' check (currency in ('AED', 'GBP', 'INR', 'USD')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table accounts enable row level security;

-- Self-referencing tree so categories can nest arbitrarily deep (most are
-- Category > Subcategory, a couple like Padel/Triathlon go one level
-- deeper). Any node — leaf or not — can be picked on a transaction.
create table if not exists dd_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references dd_categories(id) on delete cascade,
  kind text not null check (kind in ('expense', 'income')),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists dd_categories_parent_idx on dd_categories (parent_id);

alter table dd_categories enable row level security;

-- A single row covers a transfer between two accounts — no double entry.
-- account_id is the source (expense) or destination (income); for a
-- transfer it's the "from" account and to_account_id is the "to" account.
create table if not exists dd_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense', 'transfer')),
  date date not null,
  amount numeric not null,
  account_id uuid not null references accounts(id) on delete cascade,
  to_account_id uuid references accounts(id) on delete cascade,
  category_id uuid references dd_categories(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists dd_transactions_date_idx on dd_transactions (date);
create index if not exists dd_transactions_account_idx on dd_transactions (account_id);

alter table dd_transactions enable row level security;

-- Planned Expenses are per-account (each account has its own list and its
-- own income figure) rather than one shared household list. Existing rows
-- predate this, so they're backfilled onto the first account by sort
-- order — reassign them by hand afterwards if that guess is wrong. Only
-- runs the backfill when there's actually an account to assign; on a
-- fresh install with no accounts yet, account_id is simply left null and
-- gets filled in the moment an account is created and a plan is saved.
alter table expense_entries add column if not exists account_id uuid references accounts(id) on delete cascade;
update expense_entries set account_id = (select id from accounts order by sort_order limit 1)
  where account_id is null;
create index if not exists expense_entries_account_idx on expense_entries (account_id);

-- Repoints monthly_income's primary key from "one row per month" to "one
-- row per month per account", backfilling existing rows the same way.
alter table monthly_income add column if not exists account_id uuid references accounts(id) on delete cascade;
update monthly_income set account_id = (select id from accounts order by sort_order limit 1)
  where account_id is null;

-- Only repoints the primary key once every row actually has an
-- account_id — if there were no accounts yet to backfill onto, this
-- quietly waits and repoints itself next time the script is re-run.
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'monthly_income' and constraint_name = 'monthly_income_pkey'
      and constraint_type = 'PRIMARY KEY'
  ) and not exists (
    select 1 from information_schema.key_column_usage
    where table_name = 'monthly_income' and constraint_name = 'monthly_income_pkey'
      and column_name = 'account_id'
  ) and not exists (
    select 1 from monthly_income where account_id is null
  ) then
    alter table monthly_income drop constraint monthly_income_pkey;
    alter table monthly_income add primary key (month, account_id);
  end if;
end $$;

-- Per-account default income, applied automatically to any month that
-- doesn't already have its own explicit monthly_income row — set your
-- income once per account instead of re-entering it every future month.
-- Starts unset (0) for every account until you save one; a month you've
-- already saved an explicit income for is never touched by this.
create table if not exists default_income (
  account_id uuid primary key references accounts(id) on delete cascade,
  income numeric not null default 0
);

alter table default_income enable row level security;

-- People you might owe or be owed money by — a simple contact list reused
-- across receivables so you pick a name from a dropdown instead of
-- retyping it every time.
create table if not exists dd_people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table dd_people enable row level security;

-- "People Owe Me": when you pay for something and part of it is someone
-- else's share, the expense transaction stays exactly as logged (the full
-- amount really did leave your account), and each portion owed back to
-- you is tracked here as its own row — split across as many people as
-- paid you back individually. Marking one "paid_back" auto-logs an income
-- transaction for that amount (paid_transaction_id) so the account
-- balance reflects the repayment when it actually happens.
create table if not exists dd_receivables (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references dd_transactions(id) on delete cascade,
  person_id uuid references dd_people(id) on delete set null,
  amount numeric not null,
  status text not null default 'outstanding' check (status in ('outstanding', 'paid_back')),
  paid_transaction_id uuid references dd_transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists dd_receivables_transaction_idx on dd_receivables (transaction_id);
create index if not exists dd_receivables_person_idx on dd_receivables (person_id);
create index if not exists dd_receivables_status_idx on dd_receivables (status);

alter table dd_receivables enable row level security;

-- ---- Padel Tracker (under Workout Tracker) ----

-- Lifetime totals from before this page existed, when padel spending was
-- logged as ordinary Day-to-Day "Working out > Padel" transactions but
-- tournaments weren't individually itemized or datable. A singleton row
-- (the boolean-true trick guarantees at most one) added on top of the
-- real, dated Day-to-Day Padel transactions logged from here on — so
-- lifetime totals are accurate while month breakdowns only reflect what's
-- actually dated. Editable from the page if a number needs fixing. Games
-- played get their own per-year table below instead of a lump count here,
-- since those can actually be dated (roughly) from known milestones.
create table if not exists padel_baseline (
  id boolean primary key default true check (id),
  spent numeric not null default 0,
  income numeric not null default 0,
  tournaments integer not null default 0,
  wins integer not null default 0,
  runners_up integer not null default 0,
  knockouts integer not null default 0
);

alter table padel_baseline enable row level security;

-- Older installs of this table had a "games" column (a flat lifetime
-- count) before per-year tracking existed below — drop it now that
-- padel_yearly_games replaces it.
alter table padel_baseline drop column if exists games;

-- Seeded once with the real history as of when this feature was built: 7
-- tournament entries (6 at 250, 1 at 150 = 1,650) plus ~15,400 in games
-- (220 games at ~70 AED average, tracked below by year) = 17,050 spent;
-- 3 tournament wins paid 500 + 300 + 0 = 800; 2 runner-up finishes and 6/7
-- reaching the knockouts. Adjust freely from the page — this is just a
-- starting point.
insert into padel_baseline (id, spent, income, tournaments, wins, runners_up, knockouts)
values (true, 17050, 800, 7, 3, 2, 6)
on conflict (id) do nothing;

-- Games played per calendar year, from before individual games were
-- logged as dated Day-to-Day transactions — combined with real "Games"
-- transactions dated in that same year to get each year's total. Unlike
-- the single padel_baseline row, this lets "this year" / "last year" /
-- "best year" actually reflect known history instead of only lumping
-- everything pre-tracking into one all-time figure.
create table if not exists padel_yearly_games (
  year integer primary key,
  games integer not null default 0
);

alter table padel_yearly_games enable row level security;

-- Derived from cumulative milestones (5 games by Sep 17 '24, 10 by Oct 1
-- '24, 25 by Nov 22 '24, 50 by Mar 13 '25, 100 by Sep 13 '25, 150 by Jan
-- 20 '26, 200 by Aug 2 '26, ~220 total): 25 in 2024, 75 in 2025, 120 in
-- 2026 so far.
insert into padel_yearly_games (year, games) values
  (2024, 25),
  (2025, 75),
  (2026, 120)
on conflict (year) do nothing;

-- Cash prizes won from padel tournaments, logged on the Padel Tracker page
-- itself (not a Day-to-Day category) — these add straight to Padel Income.
create table if not exists padel_winnings (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table padel_winnings enable row level security;
