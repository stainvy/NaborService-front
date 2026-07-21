import { useTranslation } from 'react-i18next';
import { EventCard } from '../components/EventCard';
import { useMyEventRegistrations } from '../hooks/useEvents';

// Suivi des inscriptions de l'utilisateur courant : événements auxquels il est
// inscrit ou en liste d'attente (GET /events/me/registrations).
export function MyRegistrationsPage() {
  const { t } = useTranslation('events');
  const { data, isLoading } = useMyEventRegistrations({ limit: 100 });

  const registrations = data?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-xl font-bold text-fg">{t('registrations.title')}</h1>
      {isLoading && <p className="text-gray">…</p>}
      {!isLoading && registrations.length === 0 && (
        <p className="text-gray">{t('registrations.empty')}</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {registrations.map((event) => (
          <div key={event.id} className="relative">
            <EventCard event={event} />
            <span
              className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                event.participationStatus === 'registered'
                  ? 'bg-success/15 text-success'
                  : 'bg-orange/15 text-orange'
              }`}
            >
              {t(`registrations.status.${event.participationStatus}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
