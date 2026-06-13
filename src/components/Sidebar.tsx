import { motion } from 'framer-motion';
import { Home, Layers, BookOpen, Zap, LogOut } from 'lucide-react';
import type { PanelView } from '../types/workflow';
import { ThemeToggle } from './ThemeToggle';
import type { Theme } from './useTheme';

interface Props {
  view: PanelView;
  onChange: (v: PanelView) => void;
  savedCount: number;
  theme: Theme;
  onToggleTheme: () => void;
  userEmail?: string;
  onSignOut?: () => void;
}

const NAV = [
  { id: 'home' as PanelView, icon: Home, label: 'Home' },
  { id: 'builder' as PanelView, icon: Layers, label: 'Builder' },
  { id: 'saved' as PanelView, icon: BookOpen, label: 'Saved' },
];

export function Sidebar({ view, onChange, savedCount, theme, onToggleTheme, userEmail, onSignOut }: Props) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-logo" aria-hidden="true">
        <Zap size={22} className="logo-icon" />
        <span className="logo-text">FlowForge</span>
      </div>

      <nav className="sidebar-nav" aria-label="Site sections">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <motion.button
              key={item.id}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => onChange(item.id)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
              aria-current={active ? 'page' : undefined}
              aria-label={item.id === 'saved' && savedCount > 0
                ? `${item.label}, ${savedCount} saved workflow${savedCount !== 1 ? 's' : ''}`
                : item.label}
            >
              {active && (
                <motion.div
                  className="nav-indicator"
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  aria-hidden="true"
                />
              )}
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
              {item.id === 'saved' && savedCount > 0 && (
                <span className="nav-badge" aria-hidden="true">{savedCount}</span>
              )}
            </motion.button>
          );
        })}
      </nav>

      <ThemeToggle theme={theme} onToggle={onToggleTheme} />

      {userEmail && (
        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar" aria-hidden="true">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <span className="user-email" title={userEmail}>{userEmail}</span>
          </div>
          <button className="signout-btn" onClick={onSignOut} aria-label="Sign out">
            <LogOut size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="sidebar-footer" aria-hidden="true">
        <div className="footer-tag">Up to 8 steps</div>
        <div className="footer-sub">~3h saved per flow</div>
      </div>
    </aside>
  );
}

/* ── Bottom nav rendered in App for mobile ──────────────────────── */
export function BottomNav({ view, onChange, savedCount, theme, onToggleTheme }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Site sections">
      <div className="bottom-nav-inner">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              className={`bottom-nav-item ${active ? 'active' : ''}`}
              onClick={() => onChange(item.id)}
              aria-current={active ? 'page' : undefined}
              aria-label={item.id === 'saved' && savedCount > 0
                ? `${item.label}, ${savedCount} saved`
                : item.label}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
              {item.id === 'saved' && savedCount > 0 && (
                <span className="bottom-nav-badge" aria-hidden="true">{savedCount}</span>
              )}
            </button>
          );
        })}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} variant="mobile" />
      </div>
    </nav>
  );
}
