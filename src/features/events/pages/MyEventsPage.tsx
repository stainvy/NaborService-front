import { useTranslation } from 'react-i18next';
import { EventCard } from '../components/EventCard';
import { useMyEventOperations } from '../hooks/useEvents';

// Événements impliquant l'utilisateur courant : créés ou rejoints
// (inscrit / liste d'attente), servis par GET /events/me/operations.
export function MyEventsPage() {
  const { t } = useTranslation('events');
  const { data, isLoading } = useMyEventOperations({ limit: 100 });

  const events = data?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-xl font-bold text-fg">{t('mine.title')}</h1>
      {isLoading && <p className="text-gray">…</p>}
      {!isLoading && events.length === 0 && <p className="text-gray">{t('mine.empty')}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
