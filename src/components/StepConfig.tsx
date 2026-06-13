import { useId } from 'react';
import type { WorkflowStep } from '../types/workflow';

interface Props {
  step: WorkflowStep;
  onUpdate: (patch: Partial<WorkflowStep>) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div className="field-group">
      <label htmlFor={id} className="field-label">{label}</label>
      {/* clone child with id */}
      {children && typeof children === 'object'
        ? cloneWithId(children as React.ReactElement, id)
        : children}
    </div>
  );
}

function cloneWithId(el: React.ReactElement, id: string) {
  return { ...el, props: { ...el.props, id } };
}

export function StepConfig({ step, onUpdate }: Props) {
  const set = (key: string, value: string) =>
    onUpdate({ config: { ...step.config, [key]: value } });

  const cfg = step.config;

  return (
    <div className="step-config" role="group" aria-label={`${step.title} configuration`}>
      {step.type === 'trigger' && (
        <>
          <label>
            <span className="field-label">Event Type</span>
            <select className="cfg-select" value={String(cfg.event)} onChange={e => set('event', e.target.value)} aria-label="Event type">
              <option value="webhook">Webhook</option>
              <option value="schedule">Schedule (CRON)</option>
              <option value="email">Incoming Email</option>
              <option value="form">Form Submission</option>
              <option value="database">Database Change</option>
            </select>
          </label>
          <label>
            <span className="field-label">HTTP Method</span>
            <select className="cfg-select" value={String(cfg.method)} onChange={e => set('method', e.target.value)} aria-label="HTTP method">
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
            </select>
          </label>
        </>
      )}

      {step.type === 'filter' && (
        <>
          <label>
            <span className="field-label">Field</span>
            <input className="cfg-input" placeholder="e.g. user.role" value={String(cfg.field)} onChange={e => set('field', e.target.value)} aria-label="Field name to filter on" />
          </label>
          <label>
            <span className="field-label">Operator</span>
            <select className="cfg-select" value={String(cfg.operator)} onChange={e => set('operator', e.target.value)} aria-label="Filter operator">
              <option value="equals">Equals</option>
              <option value="not_equals">Not Equals</option>
              <option value="contains">Contains</option>
              <option value="greater_than">Greater Than</option>
              <option value="less_than">Less Than</option>
            </select>
          </label>
          <label>
            <span className="field-label">Value</span>
            <input className="cfg-input" placeholder="expected value" value={String(cfg.value)} onChange={e => set('value', e.target.value)} aria-label="Filter value" />
          </label>
        </>
      )}

      {step.type === 'transform' && (
        <>
          <label>
            <span className="field-label">Mapping Expression</span>
            <input className="cfg-input" placeholder="e.g. { name: data.full_name }" value={String(cfg.mapping)} onChange={e => set('mapping', e.target.value)} aria-label="Mapping expression" />
          </label>
          <label>
            <span className="field-label">Output Format</span>
            <select className="cfg-select" value={String(cfg.format)} onChange={e => set('format', e.target.value)} aria-label="Output format">
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="csv">CSV</option>
              <option value="text">Plain Text</option>
            </select>
          </label>
        </>
      )}

      {step.type === 'notify' && (
        <>
          <label>
            <span className="field-label">Channel</span>
            <select className="cfg-select" value={String(cfg.channel)} onChange={e => set('channel', e.target.value)} aria-label="Notification channel">
              <option value="email">Email</option>
              <option value="slack">Slack</option>
              <option value="sms">SMS</option>
              <option value="push">Push Notification</option>
              <option value="teams">Microsoft Teams</option>
            </select>
          </label>
          <label>
            <span className="field-label">Recipient</span>
            <input className="cfg-input" placeholder="user@example.com or #channel" value={String(cfg.recipient)} onChange={e => set('recipient', e.target.value)} aria-label="Recipient address or channel" />
          </label>
          <label>
            <span className="field-label">Template</span>
            <select className="cfg-select" value={String(cfg.template)} onChange={e => set('template', e.target.value)} aria-label="Notification template">
              <option value="default">Default</option>
              <option value="alert">Alert</option>
              <option value="digest">Daily Digest</option>
              <option value="custom">Custom</option>
            </select>
          </label>
        </>
      )}

      {step.type === 'integrate' && (
        <>
          <label>
            <span className="field-label">Service</span>
            <select className="cfg-select" value={String(cfg.service)} onChange={e => set('service', e.target.value)} aria-label="Integration service">
              <option value="salesforce">Salesforce</option>
              <option value="hubspot">HubSpot</option>
              <option value="jira">Jira</option>
              <option value="github">GitHub</option>
              <option value="stripe">Stripe</option>
              <option value="custom">Custom API</option>
            </select>
          </label>
          <label>
            <span className="field-label">Action</span>
            <select className="cfg-select" value={String(cfg.action)} onChange={e => set('action', e.target.value)} aria-label="Action to perform">
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="fetch">Fetch</option>
            </select>
          </label>
          <label>
            <span className="field-label">Resource / Endpoint</span>
            <input className="cfg-input" placeholder="e.g. /contacts" value={String(cfg.resource)} onChange={e => set('resource', e.target.value)} aria-label="Resource or API endpoint" />
          </label>
        </>
      )}

      {step.type === 'delay' && (
        <>
          <label>
            <span className="field-label">Duration</span>
            <input className="cfg-input" type="number" min="1" value={String(cfg.duration)} onChange={e => set('duration', e.target.value)} aria-label="Delay duration" />
          </label>
          <label>
            <span className="field-label">Unit</span>
            <select className="cfg-select" value={String(cfg.unit)} onChange={e => set('unit', e.target.value)} aria-label="Time unit">
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </label>
        </>
      )}

      {step.type === 'condition' && (
        <>
          <label>
            <span className="field-label">Expression</span>
            <input className="cfg-input" placeholder="e.g. data.amount > 1000" value={String(cfg.expression)} onChange={e => set('expression', e.target.value)} aria-label="Condition expression" />
          </label>
          <label>
            <span className="field-label">If True</span>
            <select className="cfg-select" value={String(cfg.trueBranch)} onChange={e => set('trueBranch', e.target.value)} aria-label="Action when condition is true">
              <option value="continue">Continue</option>
              <option value="stop">Stop</option>
              <option value="branch_a">Branch A</option>
            </select>
          </label>
          <label>
            <span className="field-label">If False</span>
            <select className="cfg-select" value={String(cfg.falseBranch)} onChange={e => set('falseBranch', e.target.value)} aria-label="Action when condition is false">
              <option value="stop">Stop</option>
              <option value="continue">Continue</option>
              <option value="branch_b">Branch B</option>
            </select>
          </label>
        </>
      )}

      {step.type === 'action' && (
        <>
          <label>
            <span className="field-label">Runtime</span>
            <select className="cfg-select" value={String(cfg.runtime)} onChange={e => set('runtime', e.target.value)} aria-label="Script runtime">
              <option value="node">Node.js</option>
              <option value="python">Python</option>
              <option value="bash">Bash</option>
            </select>
          </label>
          <label>
            <span className="field-label">Script / Command</span>
            <input className="cfg-input" placeholder="console.log(data)" value={String(cfg.script)} onChange={e => set('script', e.target.value)} aria-label="Script or command to run" />
          </label>
          <label>
            <span className="field-label">Timeout (sec)</span>
            <input className="cfg-input" type="number" min="1" max="300" value={String(cfg.timeout)} onChange={e => set('timeout', e.target.value)} aria-label="Timeout in seconds" />
          </label>
        </>
      )}
    </div>
  );
}
