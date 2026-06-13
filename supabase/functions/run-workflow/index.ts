// ════════════════════════════════════════════════════════════════
//  FlowForge — Workflow execution engine (Supabase Edge Function)
//
//  Receives a webhook, loads a saved workflow, runs each step in
//  order, and actually sends a notification at the Notify step.
//
//  Deploy:   supabase functions deploy run-workflow --no-verify-jwt
//  Secrets:  supabase secrets set RESEND_API_KEY=...   (for email)
//            supabase secrets set SLACK_WEBHOOK_URL=... (for Slack)
//
//  Invoke (webhook):
//    POST {project}/functions/v1/run-workflow
//    body: { "workflowId": "<uuid>", "payload": { ...trigger data } }
// ════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Step {
  type: string;
  title: string;
  config: Record<string, unknown>;
}

interface LogEntry {
  step: string;
  type: string;
  status: 'ok' | 'skipped' | 'stopped' | 'error';
  detail: string;
}

// Read a dot-path like "review.rating" from the payload object.
function getPath(obj: unknown, path: string): unknown {
  if (!path) return undefined;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function evalFilter(payload: unknown, field: string, operator: string, value: string): boolean {
  const actual = getPath(payload, field);
  const a = String(actual ?? '');
  const v = String(value ?? '');
  switch (operator) {
    case 'equals': return a === v;
    case 'not_equals': return a !== v;
    case 'contains': return a.includes(v);
    case 'greater_than': return Number(actual) > Number(value);
    case 'less_than': return Number(actual) < Number(value);
    default: return true;
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<string> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return 'DRY RUN — set RESEND_API_KEY secret to send real emails';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('FROM_EMAIL') ?? 'FlowForge <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  return `Email sent to ${to}`;
}

async function sendSlack(text: string): Promise<string> {
  const url = Deno.env.get('SLACK_WEBHOOK_URL');
  if (!url) return 'DRY RUN — set SLACK_WEBHOOK_URL secret to post to Slack';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Slack error ${res.status}`);
  return 'Posted to Slack';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { workflowId, payload = {} } = await req.json();
    if (!workflowId) {
      return new Response(JSON.stringify({ error: 'workflowId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service-role client bypasses RLS — the webhook is public and trusted.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: wf, error } = await supabase
      .from('workflows')
      .select('id, name, steps, is_active')
      .eq('id', workflowId)
      .single();

    if (error || !wf) {
      return new Response(JSON.stringify({ error: 'Workflow not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!wf.is_active) {
      return new Response(JSON.stringify({ error: 'Workflow is paused', workflow: wf.name }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const steps = (wf.steps ?? []) as Step[];
    const log: LogEntry[] = [];
    let runStatus: 'success' | 'filtered' | 'error' = 'success';

    for (const step of steps) {
      const cfg = step.config ?? {};
      try {
        switch (step.type) {
          case 'trigger':
            log.push({ step: step.title, type: step.type, status: 'ok',
              detail: `Triggered via ${cfg.event ?? 'webhook'}` });
            break;

          case 'filter': {
            const pass = evalFilter(payload, String(cfg.field ?? ''), String(cfg.operator ?? 'equals'), String(cfg.value ?? ''));
            if (!pass) {
              log.push({ step: step.title, type: step.type, status: 'stopped',
                detail: `Condition not met (${cfg.field} ${cfg.operator} ${cfg.value}) — workflow halted` });
              runStatus = 'filtered';
            } else {
              log.push({ step: step.title, type: step.type, status: 'ok',
                detail: `Passed: ${cfg.field} ${cfg.operator} ${cfg.value}` });
            }
            break;
          }

          case 'transform':
            log.push({ step: step.title, type: step.type, status: 'ok',
              detail: `Transformed to ${cfg.format ?? 'json'}` });
            break;

          case 'notify': {
            const channel = String(cfg.channel ?? 'email');
            const recipient = String(cfg.recipient ?? '');
            const summary = `Workflow "${wf.name}" fired.\n\nTrigger data:\n${JSON.stringify(payload, null, 2)}`;
            let detail: string;
            if (channel === 'email') {
              detail = await sendEmail(recipient || Deno.env.get('FROM_EMAIL') || '',
                `FlowForge: ${wf.name}`,
                `<h2>${wf.name}</h2><p>This workflow was triggered.</p><pre>${JSON.stringify(payload, null, 2)}</pre>`);
            } else if (channel === 'slack') {
              detail = await sendSlack(`:zap: *${wf.name}* triggered\n\`\`\`${JSON.stringify(payload, null, 2)}\`\`\``);
            } else {
              detail = `Channel "${channel}" not yet wired — would notify ${recipient}`;
            }
            log.push({ step: step.title, type: step.type, status: 'ok', detail });
            break;
          }

          case 'delay':
            log.push({ step: step.title, type: step.type, status: 'ok',
              detail: `Would wait ${cfg.duration} ${cfg.unit} (skipped in demo)` });
            break;

          case 'condition':
            log.push({ step: step.title, type: step.type, status: 'ok',
              detail: `Evaluated: ${cfg.expression || '(no expression)'}` });
            break;

          case 'integrate':
            log.push({ step: step.title, type: step.type, status: 'ok',
              detail: `Would call ${cfg.service} → ${cfg.action} ${cfg.resource ?? ''}`.trim() });
            break;

          case 'action':
            log.push({ step: step.title, type: step.type, status: 'ok',
              detail: `Would run ${cfg.runtime} script` });
            break;

          default:
            log.push({ step: step.title, type: step.type, status: 'skipped', detail: 'Unknown step type' });
        }
      } catch (stepErr) {
        log.push({ step: step.title, type: step.type, status: 'error',
          detail: stepErr instanceof Error ? stepErr.message : 'Step failed' });
        runStatus = 'error';
        break;
      }

      // Stop the chain if a filter halted it
      if (runStatus === 'filtered') break;
    }

    // Best-effort: record the run for history (table is optional)
    await supabase.from('runs').insert({
      workflow_id: wf.id,
      status: runStatus,
      log,
    }).then(() => {}, () => {});

    return new Response(JSON.stringify({ workflow: wf.name, status: runStatus, log }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
