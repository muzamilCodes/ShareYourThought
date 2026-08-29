'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('thoughtshare_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = saved ? (saved as 'light' | 'dark') : prefersDark ? 'dark' : 'light';

    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('thoughtshare_theme', nextTheme);
  };

  if (!mounted) {
    return null;
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle-btn"
        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        aria-label="Toggle Theme"
        style={{
          background: 'transparent',
          border: '1px solid var(--line)',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '1.05rem',
          color: 'var(--ink)',
          transition: 'all 180ms ease'
        }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="button-ghost"
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      aria-label="Toggle Theme"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.85rem',
        padding: '6px 12px'
      }}
    >
      <span>{theme === 'light' ? '🌙' : '☀️'}</span>
      <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
    </button>
  );
}
