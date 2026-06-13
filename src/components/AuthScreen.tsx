import { motion } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setNotice('Account created! If email confirmation is on, check your inbox — otherwise you can sign in now.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="auth-logo">
          <Zap size={26} className="logo-icon" aria-hidden="true" />
          <span className="logo-text">FlowForge</span>
        </div>

        <h1 className="auth-title">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth-sub">
          {mode === 'signin'
            ? 'Sign in to access your saved workflows'
            : 'Start building automations in minutes'}
        </p>

        {!isSupabaseConfigured && (
          <div className="auth-warning" role="alert">
            Supabase isn't configured yet. Copy <code>.env.example</code> to{' '}
            <code>.env.local</code>, add your project URL and anon key, then restart the dev server.
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          <label className="field-group">
            <span className="field-label">Email</span>
            <input
              className="field-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="field-group">
            <span className="field-label">Password</span>
            <input
              className="field-input"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </label>

          {error && <div className="auth-error" role="alert">{error}</div>}
          {notice && <div className="auth-notice" role="status">{notice}</div>}

          <button
            type="submit"
            className="action-btn primary large"
            disabled={busy || !isSupabaseConfigured}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {busy
              ? <><Loader2 size={16} className="badge-spinner" aria-hidden="true" /> Please wait…</>
              : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="auth-link"
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); setNotice(''); }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
