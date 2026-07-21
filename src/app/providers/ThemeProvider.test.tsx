import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';

function Probe() {
  const { mode, resolved } = useTheme();
  return (
    <span>
      mode:{mode} resolved:{resolved}
    </span>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('ThemeProvider + ThemeToggle', () => {
  it('démarre en mode système (clair) sans classe .dark', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText(/mode:system/)).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('le toggle applique .dark et persiste le choix', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
        <ThemeToggle />
      </ThemeProvider>,
    );

    const btn = screen.getByRole('button');
    // Cycle system → light → dark
    await user.click(btn); // → light
    await user.click(btn); // → dark

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('nabor-theme')).toBe('dark');
    expect(screen.getByText(/resolved:dark/)).toBeInTheDocument();

    // Retour au clair : la classe est retirée
    await user.click(btn); // → system (clair)
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('nabor-theme')).toBe('system');
  });
});
