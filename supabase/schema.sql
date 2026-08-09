-- Bloom — per-user cloud state.
-- Run this once in your Supabase project: Dashboard → SQL Editor → paste → Run.
-- Safe to re-run (idempotent).
--
-- Model: one row per user holding their tasks / history / forests / settings as
-- JSON blobs (mirrors how the app already stores each slice). Row Level Security
-- ensures a user can only ever read or write their OWN row.

create table if not exists public.user_state (
  id         uuid primary key references auth.users (id) on delete cascade,
  tasks      jsonb not null default '[]'::jsonb,
  history    jsonb not null default '[]'::jsonb,
  forests    jsonb not null default '[]'::jsonb,
  settings   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Add settings for tables created before this column existed.
alter table public.user_state
  add column if not exists settings jsonb not null default '{}'::jsonb;

alter table public.user_state enable row level security;

-- Each policy scopes access to the row whose id == the caller's auth uid.
drop policy if exists "user_state_select_own" on public.user_state;
create policy "user_state_select_own"
  on public.user_state for select
  using (auth.uid() = id);

drop policy if exists "user_state_insert_own" on public.user_state;
create policy "user_state_insert_own"
  on public.user_state for insert
  with check (auth.uid() = id);

drop policy if exists "user_state_update_own" on public.user_state;
create policy "user_state_update_own"
  on public.user_state for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Expose the table to logged-in users via the Data API (RLS still filters rows).
-- Only 'authenticated' — anonymous visitors never touch user data; no DELETE (the
-- app never deletes rows). This makes the schema work even with the project's
-- "Automatically expose new tables" setting turned off (the recommended default).
grant select, insert, update on table public.user_state to authenticated;

-- Enable Realtime so a user's other devices receive live updates.
-- (RLS still applies — each client only receives its own row's changes.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_state'
  ) then
    alter publication supabase_realtime add table public.user_state;
  end if;
end $$;
