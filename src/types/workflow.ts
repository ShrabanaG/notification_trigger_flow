export type StepStatus = 'idle' | 'active' | 'completed' | 'error';

export type StepType =
  | 'trigger'
  | 'filter'
  | 'transform'
  | 'notify'
  | 'integrate'
  | 'delay'
  | 'condition'
  | 'action';

export interface StepOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface WorkflowStep {
  id: string;
  type: StepType;
  title: string;
  description: string;
  status: StepStatus;
  config: Record<string, string | boolean | number>;
  icon: string;
  color: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt: Date;
  isActive: boolean;
}

export type PanelView = 'home' | 'builder' | 'preview' | 'saved';
