-- ════════════════════════════════════════════════════════════════
--  FlowForge — Supabase schema
--  Run this in your Supabase project → SQL Editor → New query → Run
-- ════════════════════════════════════════════════════════════════

-- 1. Workflows table ----------------------------------------------------------
create table if not exists public.workflows (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text not null default '',
  steps       jsonb not null default '[]'::jsonb,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for fast per-user listing
create index if not exists workflows_user_id_idx on public.workflows (user_id);

-- 2. Keep updated_at fresh ----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists workflows_set_updated_at on public.workflows;
create trigger workflows_set_updated_at
  before update on public.workflows
  for each row execute function public.set_updated_at();

-- 3. Row-Level Security -------------------------------------------------------
-- Each user can only read/write their OWN workflows.
alter table public.workflows enable row level security;

drop policy if exists "select own workflows" on public.workflows;
create policy "select own workflows"
  on public.workflows for select
  using (auth.uid() = user_id);

drop policy if exists "insert own workflows" on public.workflows;
create policy "insert own workflows"
  on public.workflows for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own workflows" on public.workflows;
create policy "update own workflows"
  on public.workflows for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own workflows" on public.workflows;
create policy "delete own workflows"
  on public.workflows for delete
  using (auth.uid() = user_id);

-- 4. Runs table (execution history) ------------------------------------------
create table if not exists public.runs (
  id          uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  status      text not null,            -- success | filtered | error
  log         jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists runs_workflow_id_idx on public.runs (workflow_id);

alter table public.runs enable row level security;

-- A user can read runs for workflows they own. Inserts come from the Edge
-- Function using the service-role key, which bypasses RLS.
drop policy if exists "select own runs" on public.runs;
create policy "select own runs"
  on public.runs for select
  using (
    exists (
      select 1 from public.workflows w
      where w.id = runs.workflow_id and w.user_id = auth.uid()
    )
  );

-- Stream new runs to the browser in real time (powers the live Activity feed).
alter publication supabase_realtime add table public.runs;
