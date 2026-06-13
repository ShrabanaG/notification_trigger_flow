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
  return rowToWorkflow(data as WorkflowRow);
}

/** Toggle a workflow's active flag. */
export async function setWorkflowActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('workflows')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw error;
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
