import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useState, useRef, useEffect, useId } from 'react';
import type { StepType } from '../types/workflow';
import { STEP_TYPE_LIST } from '../data/stepTemplates';

interface Props {
  count: number;
  onAdd: (type: StepType) => void;
}

export function StepPicker({ count, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const maxReached = count >= 8;
  const dialogId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  // Focus first palette item when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => firstItemRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleAdd = (type: StepType) => {
    onAdd(type);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="step-picker-wrap">
      <motion.button
        ref={triggerRef}
        className="add-step-btn"
        onClick={() => !maxReached && setOpen(v => !v)}
        whileHover={maxReached ? {} : { scale: 1.03 }}
        whileTap={maxReached ? {} : { scale: 0.97 }}
        aria-disabled={maxReached}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-label={maxReached ? 'Maximum 8 steps reached' : open ? 'Close step type picker' : 'Add a step'}
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} aria-hidden="true">
          <Plus size={18} />
        </motion.span>
        {maxReached ? 'Max 8 steps reached' : 'Add Step'}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={dialogId}
            role="dialog"
            aria-label="Choose a step type"
            aria-modal="true"
            className="step-palette"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="palette-header">
              <span id={`${dialogId}-title`}>Choose a step type</span>
              <button
                className="icon-btn"
                onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
                aria-label="Close step picker"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="palette-grid" role="list">
              {STEP_TYPE_LIST.map((s, i) => (
                <motion.button
                  key={s.type}
                  ref={i === 0 ? firstItemRef : undefined}
                  className="palette-item"
                  role="listitem"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleAdd(s.type)}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ '--item-color': s.color } as React.CSSProperties}
                  aria-label={`${s.label}: ${s.description}`}
                >
                  <span
                    className="palette-icon"
                    style={{ background: s.color + '20', border: `1.5px solid ${s.color}44` }}
                    aria-hidden="true"
                  >
                    {s.icon}
                  </span>
                  <span className="palette-label">{s.label}</span>
                  <span className="palette-desc">{s.description}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
