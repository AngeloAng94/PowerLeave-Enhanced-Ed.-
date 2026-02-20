import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      data-testid="theme-toggle"
      onClick={() => setDark(!dark)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '36px', height: '36px', borderRadius: '8px',
        border: '1px solid var(--border)', background: 'var(--card)',
        color: 'var(--foreground)', cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      title={dark ? 'Modalità chiara' : 'Modalità scura'}
    >
      {dark ? Icons.sun : Icons.moon}
    </button>
  );
}
