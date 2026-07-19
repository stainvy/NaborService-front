import { useTranslation } from 'react-i18next';

// Badge indiquant une position en liste d'attente (FIFO).
export function WaitlistBadge({ position }: { position?: number }) {
  const { t } = useTranslation('events');
  return (
    <span className="inline-block rounded-full bg-orange/15 px-2 py-0.5 text-xs font-medium text-orange">
      {position != null ? t('waitlist.position', { position }) : t('waitlist.on')}
    </span>
  );
}
