import { useTranslation } from 'react-i18next';
import { CheckSquare, Circle, CircleDot, Square } from 'lucide-react';
import type { PollType } from '@/types/polls';

interface PollSelectionIconProps {
  pollType: PollType;
  selected: boolean;
  className?: string;
}

// Distingue visuellement un sondage à choix unique (rond, façon radio) d'un
// sondage à choix multiple (carré, façon case à cocher) — les sondages
// "weighted" hérités (avant l'ajout de isWeighted) restent à choix unique.
export function PollSelectionIcon({ pollType, selected, className = 'h-4 w-4' }: PollSelectionIconProps) {
  const { t } = useTranslation('polls');
  const isMultiple = pollType === 'multiple';
  const label = t(isMultiple ? 'multiple_choice_hint' : 'single_choice_hint');

  if (isMultiple) {
    return selected ? (
      <CheckSquare className={className} aria-label={label} />
    ) : (
      <Square className={className} aria-label={label} />
    );
  }
  return selected ? (
    <CircleDot className={className} aria-label={label} />
  ) : (
    <Circle className={className} aria-label={label} />
  );
}
