import { useTranslation } from 'react-i18next';
import type { ListingStatus } from '../types';

// Palette façon leboncoin : vert = dispo, orange = en attente d'une action,
// navy = réservée (verrouillée pour les autres), gris/rouge = terminée/annulée.
const STATUS_CLASSES: Record<ListingStatus, string> = {
  open: 'bg-success/15 text-success',
  pending: 'bg-orange/15 text-orange',
  in_progress: 'bg-navy/15 text-fg',
  closed: 'bg-gray/20 text-gray',
  cancelled: 'bg-error/15 text-error',
};

const STATUS_DOT: Record<ListingStatus, string> = {
  open: 'bg-success',
  pending: 'bg-orange',
  in_progress: 'bg-navy',
  closed: 'bg-gray',
  cancelled: 'bg-error',
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  const { t } = useTranslation('listings');
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
      {t(`status.${status}`)}
    </span>
  );
}
