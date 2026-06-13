import { Moon, Sun } from 'lucide-react';
import type { Theme } from './useTheme';

interface Props {
  theme: Theme;
  onToggle: () => void;
  variant?: 'sidebar' | 'mobile';
}

export function ThemeToggle({ theme, onToggle, variant = 'sidebar' }: Props) {
  const isDark = theme === 'dark';
  const label = `Switch to ${isDark ? 'light' : 'dark'} mode`;

  if (variant === 'mobile') {
    return (
      <button
        className="theme-toggle-mobile"
        onClick={onToggle}
        aria-label={label}
        aria-pressed={isDark}
      >
        {isDark
          ? <Sun size={20} aria-hidden="true" />
          : <Moon size={20} aria-hidden="true" />}
        <span>Theme</span>
      </button>
    );
  }

  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={isDark}
    >
      {isDark
        ? <Sun size={16} className="toggle-icon" aria-hidden="true" />
        : <Moon size={16} className="toggle-icon" aria-hidden="true" />}
      <span>{isDark ? 'Dark' : 'Light'} mode</span>
      <span className="toggle-track" aria-hidden="true">
        <span
          className="toggle-knob"
          style={{ transform: isDark ? 'translateX(16px)' : 'translateX(0)', transition: 'transform 0.2s ease' }}
        />
      </span>
    </button>
  );
}
