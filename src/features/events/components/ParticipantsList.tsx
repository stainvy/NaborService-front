import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import type { EventParticipant } from '../types';

// Liste des inscrits (réservée au créateur). Réutilise l'Avatar (initiales en
// repli quand pas de photo).
export function ParticipantsList({ participants }: { participants: EventParticipant[] }) {
  const { t } = useTranslation('events');

  if (participants.length === 0) {
    return <p className="text-sm text-gray">{t('participants.empty')}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {participants.map((p, i) => (
        <li key={p.userId ?? i} className="flex items-center gap-3">
          <Avatar
            mongoId={p.user?.profilePictureMongoId}
            firstName={p.user?.firstName}
            lastName={p.user?.lastName}
            size={32}
          />
          <span className="text-sm text-navy">
            {p.user ? `${p.user.firstName ?? ''} ${p.user.lastName ?? ''}`.trim() : p.userId}
          </span>
        </li>
      ))}
    </ul>
  );
}
