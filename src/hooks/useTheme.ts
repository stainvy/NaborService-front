import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './theme-context';

/** Accès au thème courant (clair / sombre / auto) et à son changement. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme doit être utilisé à l’intérieur de <ThemeProvider>.');
  }
  return ctx;
}
