-- Run this in your Supabase project's SQL editor.
-- Safe to re-run any time you pull an update that adds columns — every
-- statement here is idempotent (IF NOT EXISTS / CREATE OR REPLACE style).

create extension if not exists "pgcrypto";

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  shoot_date date not null,
  edit_date date not null,
  post_date date not null,
  type text not null check (type in ('Reel', 'Carousel', 'Static Post', 'Story', 'Other')),
  idea text not null default '',
  inspiration text,
  shoot_notes text,
  edit_notes text,
  post_notes text,
  created_at timestamptz not null default now()
);

-- Adds these columns if you're re-running this against a table created
-- before notes fields existed.
alter table posts add column if not exists shoot_notes text;
alter table posts add column if not exists edit_notes text;
alter table posts add column if not exists post_notes text;

create index if not exists posts_shoot_date_idx on posts (shoot_date);
create index if not exists posts_edit_date_idx on posts (edit_date);
create index if not exists posts_post_date_idx on posts (post_date);

-- Row Level Security is left enabled with no policies, so only requests
-- using the service role key (server-side only, never exposed to the
-- browser) can read or write. The app's own password gate is what
-- protects access to that server code.
alter table posts enable row level security;
