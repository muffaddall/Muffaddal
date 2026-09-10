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

-- A podcast episode's own idea-to-post pipeline (shoot/edit/post, same
-- shape as posts' three stages), kept on its own dedicated Podcast page
-- instead of mixed into the shared vault/schedule/posting-schedule used
-- by Reels/Carousels/etc. An episode with no shoot_date is still just an
-- idea; setting one moves it into the schedule.
create table if not exists podcast_episodes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  idea text not null default '',
  shoot_date date,
  edit_date date,
  post_date date,
  shot_done boolean not null default false,
  edited_done boolean not null default false,
  posted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists podcast_episodes_shoot_date_idx on podcast_episodes (shoot_date);

alter table podcast_episodes enable row level security;

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
-- paid=false means it's a future planned purchase — it doesn't reduce the
-- running balance yet, only shows as a projected deduction, until you mark
-- it paid once you actually make the purchase.
create table if not exists bpf_purchases (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table bpf_purchases add column if not exists paid boolean not null default true;

alter table bpf_purchases enable row level security;

-- Purchases made using money from Savings — the Savings equivalent of
-- bpf_purchases above. Their total is subtracted from the running Savings
-- balance. Same paid=false/planned-purchase behavior as bpf_purchases.
create table if not exists savings_purchases (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table savings_purchases add column if not exists paid boolean not null default true;

alter table savings_purchases enable row level security;

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

-- Every named food you log against a meal on a given day — this is what
-- you actually type in ("Chicken sandwich", 450 kcal), so you can see what
-- made up the number later instead of just a lump total. calorie_logs'
-- breakfast/lunch/dinner/snacks columns are kept as a running cache of
-- each meal's entries summed together, recomputed whenever an entry here
-- is added or removed — the app never asks you to type a meal total by
-- hand anymore.
create table if not exists calorie_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  name text not null,
  calories numeric not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists calorie_entries_date_idx on calorie_entries (date);

alter table calorie_entries enable row level security;

-- Whether you actually ate this or just logged it as a plan — the app
-- always inserts new entries with eaten=false and you tick them off as
-- you go; this column defaults existing rows to true so calories already
-- logged before this column existed keep counting the same as before.
-- recomputeMealTotal only sums eaten=true rows into calorie_logs.
alter table calorie_entries add column if not exists eaten boolean not null default true;

-- Saved foods/meals you can quick-add to a day's log on the Calorie
-- Tracker instead of retyping calories every time (e.g. "Apple", or a
-- multi-ingredient combo like "Turkey and Eggs Breakfast"). A "snack"
-- item is offered in every meal's quick-add dropdown, not just Snacks.
create table if not exists food_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ingredients text not null default '',
  calories numeric not null default 0,
  meal_type text not null default 'snack' check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at timestamptz not null default now()
);

alter table food_items enable row level security;

-- Seeded once with a handful of common items — edit or delete freely from
-- the Foods page; new ones you add there stick around the same way.
insert into food_items (name, ingredients, calories, meal_type)
select v.name, v.ingredients, v.calories, v.meal_type
from (values
  ('Apple', '', 95, 'snack'),
  ('Orange', '', 62, 'snack'),
  ('Grapes (handful)', '', 55, 'snack'),
  ('Mango slices', '', 99, 'snack'),
  ('Turkey and Eggs Breakfast', '3 turkey slices, 3 eggs', 306, 'breakfast')
) as v(name, ingredients, calories, meal_type)
where not exists (select 1 from food_items);

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

-- One row per Monday-start week: the target you set for yourself (in km,
-- for all three disciplines including swimming — the individual Swimming
-- page still logs/paces in meters, but the weekly target lives in km to
-- stay comparable across disciplines on the Workout Tracker home page).
create table if not exists workout_weekly_targets (
  week_start date primary key,
  running_km numeric not null default 0,
  cycling_km numeric not null default 0,
  swimming_km numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table workout_weekly_targets enable row level security;

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

-- For a transfer between two different-currency accounts, the amount that
-- actually lands in the destination account, converted using whatever
-- exchange rate was entered at the time — rates change often enough that
-- this isn't computed on the fly from a single stored rate. Null means
-- "same as amount": a same-currency transfer, or one from before this
-- column existed.
alter table dd_transactions add column if not exists to_amount numeric;

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

-- ---- Education (Phase 1: Semester & Course core + GPA) ----

-- Status is a manual field rather than derived from dates, by request —
-- you flip it yourself rather than having it computed from today's date.
create table if not exists edu_semesters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'upcoming' check (status in ('current', 'past', 'upcoming')),
  created_at timestamptz not null default now()
);

alter table edu_semesters enable row level security;

-- current_letter_grade/target_grade store any AUS grade value (the GPA
-- letters A..F/XF, or a non-GPA status like P/NP/W/TR/I/IP/AUD/N/WV) — the
-- fixed AUS-wide point value per GPA letter lives in code (GPA_POINTS in
-- src/lib/types.ts), not here, since it never varies. What DOES vary per
-- course is which % range counts as which letter — that's
-- edu_course_grade_scale below.
create table if not exists edu_courses (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references edu_semesters(id) on delete cascade,
  name text not null,
  course_code text not null default '',
  credit_hours numeric not null default 3,
  instructor text not null default '',
  room text not null default '',
  current_letter_grade text,
  target_grade text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists edu_courses_semester_idx on edu_courses (semester_id);

alter table edu_courses enable row level security;

-- One row per (course, letter grade) this course actually uses, with the
-- minimum % needed to earn it — set per course since professors set their
-- own cutoffs. A letter with no row here simply isn't used in that course.
create table if not exists edu_course_grade_scale (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references edu_courses(id) on delete cascade,
  letter_grade text not null,
  min_percent numeric not null,
  created_at timestamptz not null default now(),
  unique (course_id, letter_grade)
);

create index if not exists edu_course_grade_scale_course_idx on edu_course_grade_scale (course_id);

alter table edu_course_grade_scale enable row level security;

-- ---- Education (Phase 2: live grade calculator) ----

-- Weights are per-course and should sum to 100 — enforced in the app, not
-- the DB, so a partially set-up course isn't blocked from saving.
create table if not exists edu_grade_categories (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references edu_courses(id) on delete cascade,
  name text not null,
  weight numeric not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists edu_grade_categories_course_idx on edu_grade_categories (course_id);

alter table edu_grade_categories enable row level security;

create table if not exists edu_grade_entries (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references edu_grade_categories(id) on delete cascade,
  name text not null,
  score numeric not null,
  max_score numeric not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists edu_grade_entries_category_idx on edu_grade_entries (category_id);

alter table edu_grade_entries enable row level security;

-- ---- Education (Phase 3: assignment tracker) ----

create table if not exists edu_assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references edu_courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  due_date date not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists edu_assignments_course_idx on edu_assignments (course_id);
create index if not exists edu_assignments_due_date_idx on edu_assignments (due_date);

alter table edu_assignments enable row level security;

-- ---- Education (Phase 4: exams/quizzes + study schedule) ----

create table if not exists edu_exams (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references edu_courses(id) on delete cascade,
  title text not null,
  type text not null default 'exam' check (type in ('exam', 'quiz')),
  exam_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists edu_exams_course_idx on edu_exams (course_id);
create index if not exists edu_exams_date_idx on edu_exams (exam_date);

alter table edu_exams enable row level security;

create table if not exists edu_exam_topics (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references edu_exams(id) on delete cascade,
  label text not null,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists edu_exam_topics_exam_idx on edu_exam_topics (exam_id);

alter table edu_exam_topics enable row level security;

-- Study milestones count back from exam_date by offset_days (e.g. "Topic
-- review" at 7 days out, "Consolidation" at 3, "Final review" at 1). The
-- spacing is per-exam data rather than hardcoded, so it's editable per exam
-- instead of baked into the app.
create table if not exists edu_study_milestones (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references edu_exams(id) on delete cascade,
  label text not null,
  offset_days int not null,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists edu_study_milestones_exam_idx on edu_study_milestones (exam_id);

alter table edu_study_milestones enable row level security;

-- ---- Education (Phase 5: attendance tracker) ----

-- The policy floor you set per course (e.g. 80) to be warned as attendance
-- approaches it. Null means no policy tracked for that course.
alter table edu_courses add column if not exists attendance_threshold_percent numeric;

create table if not exists edu_attendance (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references edu_courses(id) on delete cascade,
  date date not null,
  status text not null default 'attended' check (status in ('attended', 'missed', 'excused')),
  created_at timestamptz not null default now(),
  unique (course_id, date)
);

create index if not exists edu_attendance_course_idx on edu_attendance (course_id);

alter table edu_attendance enable row level security;

-- ---- Education (Phase 6: degree requirements checklist) ----

create table if not exists edu_degree_requirements (
  id uuid primary key default gen_random_uuid(),
  category text not null default '',
  name text not null,
  credit_hours numeric not null default 0,
  status text not null default 'not_started' check (status in ('completed', 'in_progress', 'not_started')),
  fulfilled_by_course_id uuid references edu_courses(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists edu_degree_requirements_fulfilled_idx on edu_degree_requirements (fulfilled_by_course_id);

alter table edu_degree_requirements enable row level security;

-- ---- Education (Phase 7: homepage "Today" view) ----

-- Weekly class meeting times (can repeat multiple times a week — one row
-- per day/time slot). Powers the homepage's "Today's classes" section.
create table if not exists edu_course_meetings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references edu_courses(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday .. 6 = Saturday
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create index if not exists edu_course_meetings_course_idx on edu_course_meetings (course_id);

alter table edu_course_meetings enable row level security;

-- ---- Education (Degree Plan: interactive course roadmap) ----

-- The roadmap itself (course boxes, terms, prerequisite arrows) is fixed
-- university curriculum data and lives in code
-- (src/lib/degreePlanCatalog.ts), not here — this table only holds the one
-- thing that's actually yours: where each course stands. course_id matches
-- a DEGREE_PLAN_COURSES id from that file, not a foreign key into
-- edu_courses (the roadmap is a separate, fixed template — not the
-- semesters/courses you track for GPA).
create table if not exists edu_degree_plan_status (
  course_id text primary key,
  status text not null default 'planned' check (status in ('completed', 'ongoing', 'planned')),
  planned_term text,
  updated_at timestamptz not null default now()
);

alter table edu_degree_plan_status enable row level security;

-- ---- Elevate Fitness Community: Padel tournament organizer ----
--
-- Separate from padel_baseline/padel_winnings/padel_yearly_games (those
-- back the Workout Tracker's money/games stats at /workouts/padel — a
-- personal finance view, not an event organizer). Everything below is
-- prefixed tourney_ instead of padel_ specifically to keep the two apart.

-- A player who has ever entered a tourney. Profiles accumulate across
-- every tourney a player joins — the app finds-or-creates by name rather
-- than requiring you to pre-register anyone, so typing the same name
-- again reuses the same profile and keeps their points running.
create table if not exists tourney_players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  created_at timestamptz not null default now()
);

-- One weekly (or whenever) event at a given level. Walks through
-- setup -> groups -> knockout -> completed as you run the day:
-- setup = entering teams, groups = round-robin group stage in progress,
-- knockout = bracket in progress, completed = a champion was decided.
create table if not exists tourneys (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('open-d', 'd-plus-c-minus', 'c-minus-c')),
  name text not null,
  date date not null,
  status text not null default 'setup' check (status in ('setup', 'groups', 'knockout', 'completed')),
  created_at timestamptz not null default now()
);

-- A doubles pairing entered into one specific tourney. Partners are
-- re-entered fresh each tourney (not a standing partnership you reuse) —
-- the two player profiles are what persists, not the pairing itself.
create table if not exists tourney_teams (
  id uuid primary key default gen_random_uuid(),
  tourney_id uuid not null references tourneys(id) on delete cascade,
  player_a_id uuid not null references tourney_players(id) on delete cascade,
  player_b_id uuid not null references tourney_players(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Entry-fee payment status, tracked per player since each half of a team
-- pays for themselves. Marked from the During Event page.
alter table tourney_teams add column if not exists player_a_paid boolean not null default false;
alter table tourney_teams add column if not exists player_b_paid boolean not null default false;

create index if not exists tourney_teams_tourney_idx on tourney_teams (tourney_id);

-- The random group-stage draw, generated once from the entered teams.
create table if not exists tourney_groups (
  id uuid primary key default gen_random_uuid(),
  tourney_id uuid not null references tourneys(id) on delete cascade,
  name text not null, -- "Group A", "Group B", ...
  sort_order int not null default 0
);

create table if not exists tourney_group_teams (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tourney_groups(id) on delete cascade,
  team_id uuid not null references tourney_teams(id) on delete cascade
);

create index if not exists tourney_group_teams_group_idx on tourney_group_teams (group_id);

-- Every match, group stage or knockout. Group matches are the full
-- round robin within a group (group_id set, round_name/round_index
-- null). Knockout matches are generated one round at a time as the
-- previous round's winners are decided; round_name is the human label
-- ('Quarterfinal'/'Semifinal'/'Final'/...) derived from how many teams
-- are left, and round_index orders the rounds.
create table if not exists tourney_matches (
  id uuid primary key default gen_random_uuid(),
  tourney_id uuid not null references tourneys(id) on delete cascade,
  stage text not null check (stage in ('group', 'knockout')),
  round_name text,
  group_id uuid references tourney_groups(id) on delete cascade,
  round_index int,
  team_a_id uuid references tourney_teams(id) on delete cascade,
  team_b_id uuid references tourney_teams(id) on delete cascade,
  team_a_score int,
  team_b_score int,
  winner_team_id uuid references tourney_teams(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists tourney_matches_tourney_idx on tourney_matches (tourney_id);

-- Point ledger — every point a player has earned, tagged with why. The
-- leaderboard is just SUM(points) grouped by player. Recomputed (old
-- events for that team/match deleted, then reinserted) whenever a score
-- changes or a team is removed, so corrections never double-count.
create table if not exists tourney_points_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references tourney_players(id) on delete cascade,
  tourney_id uuid not null references tourneys(id) on delete cascade,
  team_id uuid references tourney_teams(id) on delete cascade,
  match_id uuid references tourney_matches(id) on delete cascade,
  reason text not null check (reason in ('join', 'win')),
  points int not null,
  created_at timestamptz not null default now()
);

create index if not exists tourney_points_events_player_idx on tourney_points_events (player_id);

-- Saved group-count presets ("4 Groups", "8 Groups Small", ...) so you
-- don't have to remember/retype a number every time you draw groups for
-- a new tourney — pick a saved format on the tourney page instead. Not
-- scoped to a level; the same presets show up everywhere.
create table if not exists tourney_formats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  num_groups int not null,
  created_at timestamptz not null default now()
);

-- Loyalty program: every 5 tournaments played earns a free entry into
-- the next one. Each row is one free entry actually handed out — logged
-- the moment you mark it given (from the player's profile), so their
-- progress resets for the next cycle and the same reward can't
-- accidentally get granted twice.
create table if not exists tourney_loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references tourney_players(id) on delete cascade,
  redeemed_at timestamptz not null default now()
);

create index if not exists tourney_loyalty_rewards_player_idx on tourney_loyalty_rewards (player_id);

-- One line of a tourney's budget sheet — either expected/actual income
-- (entry fees, sponsorship, ...) or outflow (court fees, balls,
-- prizes, ...), P&L-style: a line's total is units * unit_cost, never
-- stored directly. Budgeted and actual are two independent unit/cost
-- pairs on the same row so the Budget Sheet can show them as two
-- separate P&L tables. Netflow is sum(income) - sum(outflow), computed
-- from these rows. A new tourney can copy another tourney's lines
-- (name/type/budgeted units+cost only — actual starts at the same
-- units with cost 0, since it hasn't happened yet).
create table if not exists tourney_budget_lines (
  id uuid primary key default gen_random_uuid(),
  tourney_id uuid not null references tourneys(id) on delete cascade,
  type text not null check (type in ('income', 'outflow')),
  name text not null,
  budgeted_units numeric not null default 1,
  budgeted_unit_cost numeric not null default 0,
  actual_units numeric not null default 1,
  actual_unit_cost numeric not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Migrates a table already created under the old amount-only shape.
alter table tourney_budget_lines add column if not exists budgeted_units numeric not null default 1;
alter table tourney_budget_lines add column if not exists budgeted_unit_cost numeric not null default 0;
alter table tourney_budget_lines add column if not exists actual_units numeric not null default 1;
alter table tourney_budget_lines add column if not exists actual_unit_cost numeric not null default 0;
alter table tourney_budget_lines drop column if exists budgeted_amount;
alter table tourney_budget_lines drop column if exists actual_amount;

create index if not exists tourney_budget_lines_tourney_idx on tourney_budget_lines (tourney_id);
