import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { EventCard } from '../components/EventCard';
import { useEvents } from '../hooks/useEvents';

// ⚠️ Pas de filtre « créateur » côté back → filtrage client par creatorId
// (limité à la page chargée). Les participations ne sont pas listables (pas
// d'endpoint dédié), on affiche donc les événements créés.
export function MyEventsPage() {
  const { t } = useTranslation('events');
  const { user } = useAuth();
  const { data, isLoading } = useEvents({ limit: 100 });

  const mine = (data?.data ?? []).filter((e) => e.creatorId === user?.id);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-xl font-bold text-navy">{t('mine.title')}</h1>
      {isLoading && <p className="text-gray">…</p>}
      {!isLoading && mine.length === 0 && <p className="text-gray">{t('mine.empty')}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mine.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
