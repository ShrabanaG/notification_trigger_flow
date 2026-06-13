import { supabase } from './supabase';
import type { Workflow, WorkflowStep } from '../types/workflow';

/** Shape of a row in the public.workflows table. */
interface WorkflowRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Find the cron expression if this workflow starts with a Schedule trigger. */
function scheduleCron(steps: WorkflowStep[]): string | null {
  const trigger = steps.find(s => s.type === 'trigger');
  if (trigger && trigger.config.event === 'schedule') {
    return String(trigger.config.cron ?? '0 9 * * *');
  }
  return null;
}

/** Register a cron job for a scheduled workflow. Best-effort — needs scheduling.sql. */
async function registerSchedule(workflowId: string, steps: WorkflowStep[]): Promise<void> {
  const cron = scheduleCron(steps);
  try {
    if (cron) {
      await supabase.rpc('schedule_workflow', { wf_id: workflowId, cron_expr: cron });
    } else {
      await supabase.rpc('unschedule_workflow', { wf_id: workflowId });
    }
  } catch {
    /* scheduling.sql not installed yet — ignore */
  }
}

function rowToWorkflow(row: WorkflowRow): Workflow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    steps: row.steps ?? [],
    createdAt: new Date(row.created_at),
    isActive: row.is_active,
  };
}

/** List the signed-in user's workflows, newest first. */
export async function listWorkflows(): Promise<Workflow[]> {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as WorkflowRow[]).map(rowToWorkflow);
}

/** Create a workflow for the signed-in user. */
export async function createWorkflow(input: {
  name: string;
  description: string;
  steps: WorkflowStep[];
}): Promise<Workflow> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('workflows')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description,
      steps: input.steps,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  const created = rowToWorkflow(data as WorkflowRow);
  // If it has a Schedule trigger, register the cron job.
  await registerSchedule(created.id, created.steps);
  return created;
}

/** Toggle a workflow's active flag. */
export async function setWorkflowActive(id: string, isActive: boolean): Promise<void> {
  const { data, error } = await supabase
    .from('workflows')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  // Pause → remove its cron job; activate → re-register if scheduled.
  const wf = rowToWorkflow(data as WorkflowRow);
  if (isActive) await registerSchedule(id, wf.steps);
  else { try { await supabase.rpc('unschedule_workflow', { wf_id: id }); } catch { /* ignore */ } }
}

/** Delete a workflow. */
export async function deleteWorkflow(id: string): Promise<void> {
  const { error } = await supabase.from('workflows').delete().eq('id', id);
  if (error) throw error;
}

export interface RunLogEntry {
  step: string;
  type: string;
  status: 'ok' | 'skipped' | 'stopped' | 'error';
  detail: string;
}

export interface RunResult {
  workflow: string;
  status: 'success' | 'filtered' | 'error';
  log: RunLogEntry[];
}

/**
 * Trigger a workflow by invoking the run-workflow Edge Function.
 * `payload` is the mock "trigger data" the steps run against.
 */
export async function runWorkflow(
  id: string,
  payload: Record<string, unknown> = {},
): Promise<RunResult> {
  const { data, error } = await supabase.functions.invoke('run-workflow', {
    body: { workflowId: id, payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as RunResult;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'success' | 'filtered' | 'error';
  log: RunLogEntry[];
  createdAt: Date;
}

interface RunRow {
  id: string;
  workflow_id: string;
  status: WorkflowRun['status'];
  log: RunLogEntry[];
  created_at: string;
}

function rowToRun(row: RunRow): WorkflowRun {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    status: row.status,
    log: row.log ?? [],
    createdAt: new Date(row.created_at),
  };
}

/** Recent execution history for a workflow, newest first. */
export async function listRuns(workflowId: string, limit = 8): Promise<WorkflowRun[]> {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as RunRow[]).map(rowToRun);
}

/**
 * Subscribe to live run inserts for a workflow. Returns an unsubscribe fn.
 * Requires the `runs` table to be in the supabase_realtime publication
 * (see schema.sql).
 */
export function subscribeToRuns(
  workflowId: string,
  onInsert: (run: WorkflowRun) => void,
): () => void {
  const channel = supabase
    .channel(`runs:${workflowId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'runs', filter: `workflow_id=eq.${workflowId}` },
      (payload) => onInsert(rowToRun(payload.new as RunRow)),
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
