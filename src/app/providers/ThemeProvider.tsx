import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ThemeContext,
  THEME_STORAGE_KEY,
  type ThemeContextValue,
  type ThemeMode,
} from '@/hooks/theme-context';

const MEDIA = '(prefers-color-scheme: dark)';

function readStoredMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function systemPrefersDark(): boolean {
  return window.matchMedia(MEDIA).matches;
}

// Applique la classe .dark sur <html> et fixe color-scheme (formulaires natifs).
function applyResolved(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());
  const [systemDark, setSystemDark] = useState<boolean>(() => systemPrefersDark());

  // Suit les changements de préférence système (utile en mode « system »).
  useEffect(() => {
    const mql = window.matchMedia(MEDIA);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const resolved: 'light' | 'dark' = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    applyResolved(resolved);
  }, [resolved]);

  const setMode = useCallback((next: ThemeMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setModeState(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode }),
    [mode, resolved, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
