import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { HomePage } from './components/HomePage';
import { SavedWorkflows } from './components/SavedWorkflows';
import { Sidebar, BottomNav } from './components/Sidebar';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { useTheme } from './components/useTheme';
import { useAuth } from './lib/useAuth';
import {
  createWorkflow,
  deleteWorkflow as apiDelete,
  listWorkflows,
  setWorkflowActive,
} from './lib/workflowsApi';
import type { PanelView, Workflow, WorkflowStep } from './types/workflow';
import './styles/app.css';

export default function App() {
  const [view, setView] = useState<PanelView>('home');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { theme, toggle: toggleTheme } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();

  // Load this user's workflows once authenticated.
  useEffect(() => {
    if (!user) {
      setWorkflows([]);
      return;
    }
    let cancelled = false;
    setLoadingWorkflows(true);
    setLoadError('');
    listWorkflows()
      .then(rows => { if (!cancelled) setWorkflows(rows); })
      .catch(err => { if (!cancelled) setLoadError(err.message ?? 'Failed to load workflows'); })
      .finally(() => { if (!cancelled) setLoadingWorkflows(false); });
    return () => { cancelled = true; };
  }, [user]);

  const saveWorkflow = async (input: { name: string; description: string; steps: WorkflowStep[] }) => {
    const created = await createWorkflow(input);
    setWorkflows(prev => [created, ...prev]);
  };

  const deleteWorkflow = async (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id)); // optimistic
    try { await apiDelete(id); } catch { /* reload on failure */ refresh(); }
  };

  const toggleWorkflow = async (id: string) => {
    const target = workflows.find(w => w.id === id);
    if (!target) return;
    const next = !target.isActive;
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isActive: next } : w)); // optimistic
    try { await setWorkflowActive(id, next); } catch { refresh(); }
  };

  const refresh = () => listWorkflows().then(setWorkflows).catch(() => {});

  // ── Auth gate ──────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="auth-shell">
        <Loader2 size={28} className="badge-spinner" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // ── Authenticated app ──────────────────────────────────────────
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <div className="app-shell">
        <Sidebar
          view={view}
          onChange={setView}
          savedCount={workflows.length}
          theme={theme}
          onToggleTheme={toggleTheme}
          userEmail={user.email ?? ''}
          onSignOut={signOut}
        />

        <main id="main-content" className="main-content" tabIndex={-1}>
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div key="home" {...pageAnim}>
                <HomePage onNavigate={setView} />
              </motion.div>
            )}
            {view === 'builder' && (
              <motion.div key="builder" {...pageAnim}>
                <header className="page-header">
                  <h1 className="page-title">Workflow Builder</h1>
                  <p className="page-sub">Design your automation — add, configure, and simulate up to 8 steps</p>
                </header>
                <WorkflowBuilder onSave={saveWorkflow} />
              </motion.div>
            )}
            {view === 'saved' && (
              <motion.div key="saved" {...pageAnim}>
                <header className="page-header">
                  <h1 className="page-title">Saved Workflows</h1>
                  <p className="page-sub">
                    {loadingWorkflows
                      ? 'Loading…'
                      : workflows.length === 0
                        ? 'No workflows saved yet'
                        : `${workflows.length} workflow${workflows.length !== 1 ? 's' : ''} saved`}
                  </p>
                </header>
                {loadError && <div className="auth-error" role="alert">{loadError}</div>}
                {loadingWorkflows ? (
                  <div className="empty-state" aria-busy="true">
                    <Loader2 size={28} className="badge-spinner" aria-hidden="true" />
                    <p className="empty-sub" style={{ marginTop: 12 }}>Loading your workflows…</p>
                  </div>
                ) : (
                  <SavedWorkflows
                    workflows={workflows}
                    onDelete={deleteWorkflow}
                    onToggle={toggleWorkflow}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile sign-out (sidebar hidden on small screens) */}
          <button className="mobile-signout" onClick={signOut} aria-label="Sign out">
            <LogOut size={15} aria-hidden="true" /> Sign out
          </button>
        </main>

        <BottomNav
          view={view}
          onChange={setView}
          savedCount={workflows.length}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>
    </>
  );
}

const pageAnim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: 'easeOut' as const },
};
