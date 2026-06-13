import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, Loader2, Play, RotateCcw, Save } from 'lucide-react';
import { useCallback, useId, useRef, useState } from 'react';
import { STEP_TEMPLATES } from '../data/stepTemplates';
import type { StepType, WorkflowStep } from '../types/workflow';
import { StepCard } from './StepCard';
import { StepPicker } from './StepPicker';

interface Props {
  onSave: (input: { name: string; description: string; steps: WorkflowStep[] }) => Promise<void>;
}

let idCounter = 1;

function makeStep(type: StepType): WorkflowStep {
  const template = STEP_TEMPLATES[type];
  return { ...template, id: `step-${idCounter++}`, status: 'idle' };
}

export function WorkflowBuilder({ onSave }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [liveMsg, setLiveMsg] = useState('');

  const nameId = useId();
  const descId = useId();
  const progressId = useId();
  const liveRef = useRef<HTMLDivElement>(null);

  const addStep = useCallback((type: StepType) => {
    setSteps(prev => [...prev, makeStep(type)]);
  }, []);

  const removeStep = useCallback((id: string) => {
    setSteps(prev => {
      const removed = prev.find(s => s.id === id);
      if (removed) setLiveMsg(`Removed ${removed.title} step`);
      return prev.filter(s => s.id !== id);
    });
  }, []);

  const updateStep = useCallback((id: string, patch: Partial<WorkflowStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const reset = () => {
    setSteps([]);
    setName('');
    setDescription('');
    setSaved(false);
    setLiveMsg('Workflow reset');
  };

  const simulate = async () => {
    if (!steps.length) return;
    setSimulating(true);
    setLiveMsg('Simulation started');
    for (let i = 0; i < steps.length; i++) {
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'active' } : s));
      setLiveMsg(`Running step ${i + 1}: ${steps[i].title}`);
      await new Promise(r => setTimeout(r, 700));
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'completed' } : s));
    }
    setLiveMsg('Simulation complete — all steps passed');
    setSimulating(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !steps.length || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        // strip transient simulation status before persisting
        steps: steps.map(s => ({ ...s, status: 'idle' as const })),
      });
      setSaved(true);
      setLiveMsg(`Workflow "${name.trim()}" saved successfully`);
      reset();
      setSaved(true); // reset() clears it; re-set so the "Saved!" label shows
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save workflow';
      setSaveError(msg);
      setLiveMsg(`Error saving workflow: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const canSave = name.trim().length > 0 && steps.length > 0;
  const progressPct = Math.round((steps.length / 8) * 100);

  // Why is Save disabled? Surface it so the user is never guessing.
  const saveHint =
    steps.length === 0 && !name.trim()
      ? 'Add a name and at least one step to save'
      : !name.trim()
        ? 'Add a workflow name to save'
        : steps.length === 0
          ? 'Add at least one step to save'
          : '';

  return (
    <div className="builder-wrap">
      {/* Live region for screen readers */}
      <div
        ref={liveRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMsg}
      </div>

      {/* Workflow Meta */}
      <motion.div
        className="meta-card"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        role="group"
        aria-label="Workflow details"
      >
        <div className="meta-fields">
          <div className="field-group">
            <label htmlFor={nameId} className="field-label">Workflow Name</label>
            <input
              id={nameId}
              className="field-input"
              placeholder="e.g. New Lead Nurture Flow"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={60}
              aria-required="true"
              aria-describedby={`${nameId}-hint`}
            />
            <span id={`${nameId}-hint`} className="sr-only">Required. Maximum 60 characters.</span>
          </div>
          <div className="field-group">
            <label htmlFor={descId} className="field-label">Description</label>
            <input
              id={descId}
              className="field-input"
              placeholder="What does this workflow do?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={120}
            />
          </div>
        </div>

        <div className="meta-stats">
          <div className="stat-pill" aria-hidden="true">
            <span className="stat-val">{steps.length}</span>
            <span className="stat-lbl">/ 8 Steps</span>
          </div>
          <div
            id={progressId}
            role="progressbar"
            aria-valuenow={steps.length}
            aria-valuemin={0}
            aria-valuemax={8}
            aria-label={`${steps.length} of 8 steps added`}
            className="progress-track"
          >
            <motion.div
              className="progress-fill"
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Steps list */}
      <section aria-label="Workflow steps" aria-describedby="steps-hint">
        <p id="steps-hint" className="sr-only">
          {steps.length === 0
            ? 'No steps added yet. Use the Add Step button below to begin.'
            : `${steps.length} step${steps.length !== 1 ? 's' : ''} in this workflow.`}
        </p>

        <div className="steps-area">
          <AnimatePresence mode="popLayout">
            {steps.length === 0 && (
              <motion.div
                key="empty"
                className="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-hidden="true"
              >
                <div className="empty-icon">🚀</div>
                <p className="empty-title">Build your automation</p>
                <p className="empty-sub">Add up to 8 steps to define your end-to-end process</p>
              </motion.div>
            )}

            {steps.map((step, idx) => (
              <StepCard
                key={step.id}
                step={step}
                index={idx}
                total={steps.length}
                onRemove={removeStep}
                onUpdate={updateStep}
              />
            ))}
          </AnimatePresence>

          <StepPicker count={steps.length} onAdd={addStep} />
        </div>
      </section>

      {/* Action bar */}
      <motion.div
        className="action-bar"
        role="toolbar"
        aria-label="Workflow actions"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button
          className="action-btn ghost"
          onClick={reset}
          disabled={simulating}
          aria-label="Reset workflow — clears all steps and fields"
        >
          <RotateCcw size={15} aria-hidden="true" /> Reset
        </button>

        <button
          className="action-btn secondary"
          onClick={simulate}
          disabled={simulating || !steps.length}
          aria-label={simulating ? 'Simulation running' : `Simulate workflow with ${steps.length} step${steps.length !== 1 ? 's' : ''}`}
          aria-busy={simulating}
        >
          <Play size={15} aria-hidden="true" />
          {simulating ? 'Running…' : 'Simulate'}
        </button>

        <motion.button
          className={`action-btn primary ${!canSave ? 'disabled' : ''}`}
          onClick={handleSave}
          disabled={!canSave || simulating || saving}
          aria-disabled={!canSave || simulating || saving}
          aria-label={!name.trim() ? 'Enter a workflow name to save' : !steps.length ? 'Add at least one step to save' : 'Save workflow'}
          aria-busy={saving}
          whileHover={canSave ? { scale: 1.03 } : {}}
          whileTap={canSave ? { scale: 0.97 } : {}}
        >
          <AnimatePresence mode="wait">
            {saving ? (
              <motion.span key="saving" className="flex-center gap-6"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 size={15} className="badge-spinner" aria-hidden="true" /> Saving…
              </motion.span>
            ) : saved ? (
              <motion.span key="saved" className="flex-center gap-6"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <CheckCircle2 size={15} aria-hidden="true" /> Saved!
              </motion.span>
            ) : (
              <motion.span key="save" className="flex-center gap-6"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Save size={15} aria-hidden="true" /> Save Workflow
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      {saveHint && !saving && (
        <motion.p
          className="save-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          aria-hidden="true"
        >
          <Info size={13} aria-hidden="true" /> {saveHint}
        </motion.p>
      )}

      {saveError && (
        <div className="auth-error" role="alert" style={{ marginTop: 12 }}>
          {saveError}
        </div>
      )}
    </div>
  );
}
