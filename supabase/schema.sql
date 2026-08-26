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

-- Declared monthly income, one row per month (defaults to 15000 like the sheet).
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

-- Small key/value store for app-wide settings — currently just the AED-per-USD
-- rate used to convert "Investment funding" expense entries (in AED) into the
-- USD contribution figures on the Investments tab. AED is pegged to USD at
-- 3.6725, but this stays editable in case you want to reflect the slightly
-- different rate your broker actually applies.
create table if not exists app_settings (
  key text primary key,
  value numeric not null
);

alter table app_settings enable row level security;

insert into app_settings (key, value) values ('aed_per_usd', 3.6725)
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
  distance_km numeric not null,
  duration_min numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists workout_logs_discipline_idx on workout_logs (discipline);
create index if not exists workout_logs_date_idx on workout_logs (date);

alter table workout_logs enable row level security;
