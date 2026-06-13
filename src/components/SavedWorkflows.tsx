import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ToggleLeft, ToggleRight, Clock, Play, Loader2, Activity, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Workflow } from '../types/workflow';
import { listRuns, runWorkflow, subscribeToRuns, type WorkflowRun } from '../lib/workflowsApi';

interface Props {
  workflows: Workflow[];
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_LABEL: Record<WorkflowRun['status'], string> = {
  success: 'Success',
  filtered: 'Filtered out',
  error: 'Error',
};

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
  const [error, setError] = useState('');
  const [showActivity, setShowActivity] = useState(false);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const loadedRef = useRef(false);

  // Load history the first time Activity is opened, and keep a live subscription.
  useEffect(() => {
    if (!showActivity) return;
    let active = true;

    if (!loadedRef.current) {
      setLoadingRuns(true);
      listRuns(wf.id)
        .then(r => { if (active) { setRuns(r); loadedRef.current = true; } })
        .catch(() => {})
        .finally(() => { if (active) setLoadingRuns(false); });
    }

    const unsubscribe = subscribeToRuns(wf.id, (run) => {
      setRuns(prev => prev.some(r => r.id === run.id) ? prev : [run, ...prev].slice(0, 12));
      setFlashId(run.id);
      setTimeout(() => setFlashId(null), 1500);
    });

    return () => { active = false; unsubscribe(); };
  }, [showActivity, wf.id]);

  const handleRun = async () => {
    setRunning(true);
    setError('');
    setShowActivity(true); // reveal the live log
    try {
      const res = await runWorkflow(wf.id, {
        source: 'manual-test',
        review: { rating: '1', text: 'Test trigger from FlowForge' },
        triggeredAt: new Date().toISOString(),
      });

      // Build a run entry straight from the function's response so the log
      // shows even if the `runs` table / Realtime isn't set up yet.
      const immediate: WorkflowRun = {
        id: `live-${Date.now()}`,
        workflowId: wf.id,
        status: res.status,
        log: res.log,
        createdAt: new Date(),
      };

      // Prefer the persisted history if the runs table exists; otherwise
      // fall back to the immediate result.
      try {
        const fresh = await listRuns(wf.id);
        setRuns(fresh.length ? fresh : [immediate]);
      } catch {
        setRuns(prev => [immediate, ...prev]);
      }
      loadedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  const lastRun = runs[0];

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

      <div className="saved-card-footer">
        <div className={`status-badge ${wf.isActive ? 'active' : 'inactive'}`} aria-live="polite">
          {wf.isActive ? 'Active' : 'Paused'}
        </div>

        {/* Last-run summary + toggle */}
        <button
          className="activity-toggle"
          onClick={() => setShowActivity(v => !v)}
          aria-expanded={showActivity}
        >
          <Activity size={13} aria-hidden="true" />
          {lastRun
            ? <>Last run <span className={`mini-pill run-${lastRun.status}`}>{STATUS_LABEL[lastRun.status]}</span> {timeAgo(lastRun.createdAt)}</>
            : 'Activity'}
          <ChevronDown size={14} className={`chev ${showActivity ? 'open' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {error && <p className="run-error" role="alert">{error}</p>}

      {/* Live activity feed */}
      <AnimatePresence>
        {showActivity && (
          <motion.div
            className="run-result"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="run-result-inner">
              <div className="activity-head">
                <span className="activity-title">
                  <span className="live-dot" aria-hidden="true" /> Live activity
                </span>
                <span className="activity-count">{runs.length} run{runs.length !== 1 ? 's' : ''}</span>
              </div>

              {loadingRuns && (
                <div className="activity-loading">
                  <Loader2 size={16} className="badge-spinner" aria-hidden="true" /> Loading history…
                </div>
              )}

              {!loadingRuns && runs.length === 0 && (
                <p className="activity-empty">No runs yet — hit <strong>Run</strong> to fire this workflow.</p>
              )}

              <ul className="activity-list" aria-live="polite">
                {runs.map(run => (
                  <li key={run.id} className={`activity-run ${flashId === run.id ? 'flash' : ''}`}>
                    <div className="activity-run-head">
                      <span className={`mini-pill run-${run.status}`}>{STATUS_LABEL[run.status]}</span>
                      <span className="activity-time">{timeAgo(run.createdAt)}</span>
                    </div>
                    <ol className="run-log">
                      {run.log.map((entry, i) => (
                        <li key={i} className={`run-log-item log-${entry.status}`}>
                          <span className="log-dot" aria-hidden="true" />
                          <span className="log-step">{entry.step}</span>
                          <span className="log-detail">{entry.detail}</span>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
