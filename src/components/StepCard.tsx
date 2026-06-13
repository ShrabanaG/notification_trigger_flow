import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ChevronDown, ChevronUp, Settings, Check, Loader2 } from 'lucide-react';
import { useState, useId } from 'react';
import type { WorkflowStep } from '../types/workflow';
import { StepConfig } from './StepConfig';

interface Props {
  step: WorkflowStep;
  index: number;
  total: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<WorkflowStep>) => void;
}

export function StepCard({ step, index, total, onRemove, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const headerId = useId();

  const toggle = () => setExpanded(e => !e);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -24, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className={`step-card status-${step.status}`}
      style={{ '--step-color': step.color } as React.CSSProperties}
      role="article"
      aria-label={`Step ${index + 1}: ${step.title}${step.status === 'active' ? ' (running)' : step.status === 'completed' ? ' (completed)' : ''}`}
    >
      {/* connector line above (skip first) */}
      {index > 0 && (
        <div className="connector" aria-hidden="true">
          <div className="connector-line" />
          <div className="connector-dot" style={{ background: step.color }} />
        </div>
      )}

      <div
        className="step-header"
        onClick={toggle}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle())}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={panelId}
        id={headerId}
        aria-label={`${step.title} — ${step.description}. ${expanded ? 'Collapse' : 'Expand'} configuration`}
      >
        <div
          className="step-badge"
          style={
            step.status === 'completed'
              ? { background: 'var(--green)', border: '1.5px solid var(--green)' }
              : { background: step.color + '22', border: `1.5px solid ${step.color}55` }
          }
          aria-hidden="true"
        >
          {step.status === 'active' ? (
            <Loader2 size={14} className="badge-spinner" />
          ) : step.status === 'completed' ? (
            <Check size={15} strokeWidth={3} color="#fff" />
          ) : (
            <span className="step-num">{index + 1}</span>
          )}
        </div>

        <div className="step-icon-wrap" style={{ background: step.color + '18' }} aria-hidden="true">
          <span className="step-icon">{step.icon}</span>
        </div>

        <div className="step-meta">
          <span className="step-title">{step.title}</span>
          <span className="step-desc">{step.description}</span>
        </div>

        <div className="step-actions">
          <button
            className="icon-btn settings"
            onClick={e => { e.stopPropagation(); toggle(); }}
            aria-label={`Configure ${step.title}`}
            aria-expanded={expanded}
            aria-controls={panelId}
            tabIndex={-1}
          >
            <Settings size={14} aria-hidden="true" />
          </button>
          <button
            className="icon-btn danger"
            onClick={e => { e.stopPropagation(); onRemove(step.id); }}
            aria-label={`Remove ${step.title} step`}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
          {expanded
            ? <ChevronUp size={16} className="chevron" aria-hidden="true" />
            : <ChevronDown size={16} className="chevron" aria-hidden="true" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            key="config"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <StepConfig step={step} onUpdate={(patch) => onUpdate(step.id, patch)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="step-position-pill" aria-hidden="true">
        {index + 1} / {total}
      </div>
    </motion.div>
  );
}
