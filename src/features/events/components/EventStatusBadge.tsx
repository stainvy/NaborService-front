import { useTranslation } from 'react-i18next';
import type { EventStatus } from '../types';

const STATUS_CLASSES: Record<EventStatus, string> = {
  draft: 'bg-gray/20 text-gray',
  published: 'bg-navy/15 text-navy',
  open: 'bg-success/15 text-success',
  in_progress: 'bg-orange/15 text-orange',
  completed: 'bg-gray/20 text-gray',
  cancelled: 'bg-error/15 text-error',
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const { t } = useTranslation('events');
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}
