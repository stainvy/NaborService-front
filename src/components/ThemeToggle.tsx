import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeMode } from '@/hooks/theme-context';

const ORDER: ThemeMode[] = ['light', 'dark', 'system'];
const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

// Bouton clair / sombre / auto : cycle entre les trois modes. L'icône reflète
// le mode choisi ; aria-label et title traduits, activable au clavier.
// `className` permet d'adapter les couleurs (ex. sidebar admin sombre).
export function ThemeToggle({
  className = 'text-fg hover:bg-surface-2',
}: {
  className?: string;
}) {
  const { t } = useTranslation('common');
  const { mode, setMode } = useTheme();

  const Icon = ICONS[mode];
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      aria-label={`${t('theme.toggle')} : ${t(`theme.${mode}`)}`}
      title={`${t('theme.label')}: ${t(`theme.${mode}`)}`}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${className}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
