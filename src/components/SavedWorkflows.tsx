import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ToggleLeft, ToggleRight, Clock, Play, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import type { Workflow } from '../types/workflow';
import { runWorkflow, type RunResult } from '../lib/workflowsApi';

interface Props {
  workflows: Workflow[];
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export function SavedWorkflows({ workflows, onDelete, onToggle }: Props) {
  if (workflows.length === 0) {
    return (
      <motion.div
        className="empty-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        role="status"
        aria-live="polite"
      >
        <div className="empty-icon" aria-hidden="true">📂</div>
        <p className="empty-title">No saved workflows yet</p>
        <p className="empty-sub">Create and save a workflow to see it here</p>
      </motion.div>
    );
  }

  return (
    <ul className="saved-list" aria-label={`${workflows.length} saved workflow${workflows.length !== 1 ? 's' : ''}`}>
      <AnimatePresence>
        {workflows.map((wf, i) => (
          <SavedWorkflowCard key={wf.id} wf={wf} index={i} onDelete={onDelete} onToggle={onToggle} />
        ))}
      </AnimatePresence>
    </ul>
  );
}

function SavedWorkflowCard({
  wf, index, onDelete, onToggle,
}: {
  wf: Workflow;
  index: number;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState('');

  const handleRun = async () => {
    setRunning(true);
    setError('');
    setResult(null);
    try {
      // Sample trigger data so Filter/Notify steps have something to act on.
      const res = await runWorkflow(wf.id, {
        source: 'manual-test',
        review: { rating: '1', text: 'Test trigger from FlowForge' },
        triggeredAt: new Date().toISOString(),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <motion.li
      className="saved-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, scale: 0.95 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
      aria-label={`${wf.name} — ${wf.isActive ? 'Active' : 'Paused'}, ${wf.steps.length} step${wf.steps.length !== 1 ? 's' : ''}`}
    >
      <div className="saved-card-top">
        <div className="saved-info">
          <h3 className="saved-name">{wf.name}</h3>
          {wf.description && <p className="saved-desc">{wf.description}</p>}
          <div className="saved-meta" aria-label="Created date and step count">
            <Clock size={12} aria-hidden="true" />
            <span>{wf.createdAt.toLocaleDateString()} · {wf.steps.length} step{wf.steps.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="saved-controls" role="group" aria-label={`Controls for ${wf.name}`}>
          <button
            className="run-btn"
            onClick={handleRun}
            disabled={running || !wf.isActive}
            aria-label={wf.isActive ? `Run ${wf.name} now` : 'Activate workflow to run it'}
            aria-busy={running}
            title={wf.isActive ? 'Run now' : 'Activate to run'}
          >
            {running
              ? <Loader2 size={14} className="badge-spinner" aria-hidden="true" />
              : <Play size={14} aria-hidden="true" />}
            {running ? 'Running…' : 'Run'}
          </button>
          <button
            className="icon-btn"
            onClick={() => onToggle(wf.id)}
            aria-label={wf.isActive ? `Pause ${wf.name}` : `Activate ${wf.name}`}
            aria-pressed={wf.isActive}
          >
            {wf.isActive
              ? <ToggleRight size={22} className="toggle-on" aria-hidden="true" />
              : <ToggleLeft size={22} className="toggle-off" aria-hidden="true" />}
          </button>
          <button
            className="icon-btn danger"
            onClick={() => onDelete(wf.id)}
            aria-label={`Delete ${wf.name}`}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Step chips */}
      <div className="step-chips" role="list" aria-label="Workflow steps">
        {wf.steps.map((s, idx) => (
          <span
            key={s.id}
            className="step-chip"
            role="listitem"
            style={{ background: s.color + '18', borderColor: s.color + '55', color: s.color }}
            aria-label={s.title}
          >
            <span aria-hidden="true">{s.icon}</span> {s.title}
            {idx < wf.steps.length - 1 && <span className="chip-arrow" aria-hidden="true">→</span>}
          </span>
        ))}
      </div>

      <div className={`status-badge ${wf.isActive ? 'active' : 'inactive'}`} aria-live="polite">
        {wf.isActive ? 'Active' : 'Paused'}
      </div>

      {/* Run result log */}
      <AnimatePresence>
        {(result || error) && (
          <motion.div
            className="run-result"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="run-result-inner" role="status" aria-live="polite">
              <div className="run-result-head">
                <span className={`run-status-pill run-${result?.status ?? 'error'}`}>
                  {error ? 'Error' : result?.status === 'success' ? 'Success'
                    : result?.status === 'filtered' ? 'Filtered out' : 'Error'}
                </span>
                <button
                  className="icon-btn"
                  onClick={() => { setResult(null); setError(''); }}
                  aria-label="Dismiss run result"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>

              {error && <p className="run-error">{error}</p>}

              {result && (
                <ol className="run-log">
                  {result.log.map((entry, i) => (
                    <li key={i} className={`run-log-item log-${entry.status}`}>
                      <span className="log-dot" aria-hidden="true" />
                      <span className="log-step">{entry.step}</span>
                      <span className="log-detail">{entry.detail}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
