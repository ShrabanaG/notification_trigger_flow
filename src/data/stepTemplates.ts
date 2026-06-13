import type { StepType, WorkflowStep } from '../types/workflow';

export const STEP_TEMPLATES: Record<StepType, Omit<WorkflowStep, 'id' | 'status'>> = {
  trigger: {
    type: 'trigger',
    title: 'Trigger',
    description: 'Start the workflow when an event occurs',
    config: { event: 'webhook', method: 'POST', cron: '0 9 * * *' },
    icon: '⚡',
    color: '#7C3AED',
  },
  filter: {
    type: 'filter',
    title: 'Filter',
    description: 'Apply conditions to route or block data',
    config: { field: '', operator: 'equals', value: '' },
    icon: '🔍',
    color: '#2563EB',
  },
  transform: {
    type: 'transform',
    title: 'Transform',
    description: 'Reshape or enrich your data',
    config: { mapping: '', format: 'json' },
    icon: '🔄',
    color: '#0891B2',
  },
  notify: {
    type: 'notify',
    title: 'Notify',
    description: 'Send alerts via email, Slack, or SMS',
    config: { channel: 'email', recipient: '', template: 'default' },
    icon: '🔔',
    color: '#059669',
  },
  integrate: {
    type: 'integrate',
    title: 'Integrate',
    description: 'Connect to external services and APIs',
    config: { service: 'salesforce', action: 'create', resource: '' },
    icon: '🔗',
    color: '#D97706',
  },
  delay: {
    type: 'delay',
    title: 'Delay',
    description: 'Pause execution for a set duration',
    config: { duration: '5', unit: 'minutes' },
    icon: '⏱️',
    color: '#DB2777',
  },
  condition: {
    type: 'condition',
    title: 'Condition',
    description: 'Branch the workflow based on logic',
    config: { expression: '', trueBranch: 'continue', falseBranch: 'stop' },
    icon: '🌿',
    color: '#65A30D',
  },
  action: {
    type: 'action',
    title: 'Action',
    description: 'Execute a custom operation or script',
    config: { script: '', runtime: 'node', timeout: '30' },
    icon: '⚙️',
    color: '#DC2626',
  },
};

export const STEP_TYPE_LIST: { type: StepType; label: string; description: string; icon: string; color: string }[] = [
  { type: 'trigger', label: 'Trigger', description: 'Start on an event', icon: '⚡', color: '#7C3AED' },
  { type: 'filter', label: 'Filter', description: 'Conditional routing', icon: '🔍', color: '#2563EB' },
  { type: 'transform', label: 'Transform', description: 'Reshape data', icon: '🔄', color: '#0891B2' },
  { type: 'notify', label: 'Notify', description: 'Send alerts', icon: '🔔', color: '#059669' },
  { type: 'integrate', label: 'Integrate', description: 'External services', icon: '🔗', color: '#D97706' },
  { type: 'delay', label: 'Delay', description: 'Wait / throttle', icon: '⏱️', color: '#DB2777' },
  { type: 'condition', label: 'Condition', description: 'Branch logic', icon: '🌿', color: '#65A30D' },
  { type: 'action', label: 'Action', description: 'Custom script', icon: '⚙️', color: '#DC2626' },
];
