import { useTranslation } from 'react-i18next';
import type { ListingStatus } from '../types';

const STATUS_CLASSES: Record<ListingStatus, string> = {
  open: 'bg-success/15 text-success',
  pending: 'bg-orange/15 text-orange',
  in_progress: 'bg-navy/15 text-navy',
  closed: 'bg-gray/20 text-gray',
  cancelled: 'bg-error/15 text-error',
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  const { t } = useTranslation('listings');
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}
