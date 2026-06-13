-- ════════════════════════════════════════════════════════════════
--  FlowForge — Scheduled triggers (pg_cron + pg_net)
--
--  Run this AFTER schema.sql, and AFTER deploying the run-workflow
--  Edge Function. It lets a workflow with a "Schedule" trigger fire
--  itself on a cron expression by calling the Edge Function.
--
--  Prereqs (enable once, in Supabase → Database → Extensions):
--    - pg_cron
--    - pg_net
-- ════════════════════════════════════════════════════════════════

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ── 1. Store your project URL + anon key so the cron job can call the
--       Edge Function. Replace the two values below, then run once. ──
--  (Vault is the production-grade option; a tiny settings table keeps
--   this approachable.)
create table if not exists public.app_settings (
  key   text primary key,
  value text not null
);

-- 🔧 EDIT THESE TWO LINES with your project's values, then run the file:
insert into public.app_settings (key, value) values
  ('edge_url',  'https://YOUR-PROJECT-REF.supabase.co/functions/v1/run-workflow'),
  ('anon_key',  'YOUR-ANON-PUBLIC-KEY')
on conflict (key) do update set value = excluded.value;

-- Lock the table down — only the service role / SQL editor should read it.
alter table public.app_settings enable row level security;

-- ── 2. schedule_workflow(workflow_id, cron_expr) ──────────────────
--  Creates/updates a cron job named "wf_<id>" that POSTs to the Edge
--  Function. Safe to call repeatedly (it unschedules the old one first).
create or replace function public.schedule_workflow(wf_id uuid, cron_expr text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  job_name text := 'wf_' || replace(wf_id::text, '-', '');
  edge_url text;
  anon_key text;
begin
  select value into edge_url from public.app_settings where key = 'edge_url';
  select value into anon_key from public.app_settings where key = 'anon_key';

  -- Remove any existing job with this name (ignore if absent)
  perform cron.unschedule(job_name)
  where exists (select 1 from cron.job where jobname = job_name);

  perform cron.schedule(
    job_name,
    cron_expr,
    format(
      $job$
        select net.http_post(
          url     := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || %L
          ),
          body    := jsonb_build_object(
            'workflowId', %L,
            'payload', jsonb_build_object('source', 'schedule')
          )
        );
      $job$,
      edge_url, anon_key, wf_id::text
    )
  );
end;
$$;

-- ── 3. unschedule_workflow(workflow_id) ───────────────────────────
create or replace function public.unschedule_workflow(wf_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  job_name text := 'wf_' || replace(wf_id::text, '-', '');
begin
  perform cron.unschedule(job_name)
  where exists (select 1 from cron.job where jobname = job_name);
end;
$$;

-- Allow signed-in users to call these via RPC for their own workflows.
grant execute on function public.schedule_workflow(uuid, text) to authenticated;
grant execute on function public.unschedule_workflow(uuid) to authenticated;
