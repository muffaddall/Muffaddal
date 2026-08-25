-- Run this in your Supabase project's SQL editor.
-- Safe to re-run any time you pull an update that adds columns/tables —
-- every statement here is idempotent.

create extension if not exists "pgcrypto";

-- One row per expense line item, scoped to the first-of-month it belongs to.
create table if not exists expense_entries (
  id uuid primary key default gen_random_uuid(),
  month date not null,
  date_label text not null default '1st',
  name text not null,
  amount numeric not null default 0,
  category text not null default 'recurring'
    check (category in ('recurring', 'stoppable', 'installment', 'debt', 'one_off')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists expense_entries_month_idx on expense_entries (month);

alter table expense_entries enable row level security;

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

-- Standing debts. Store amounts negative (owed) to match how the sheet signs them.
create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table debts enable row level security;

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

-- Row Level Security is left enabled with no policies, so only requests
-- using the service role key (server-side only, never exposed to the
-- browser) can read or write. The app's own password gate is what
-- protects access to that server code.
