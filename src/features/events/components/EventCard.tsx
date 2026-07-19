import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Users } from 'lucide-react';
import { EventStatusBadge } from './EventStatusBadge';
import { formatDateTime, formatEuros } from '../format';
import type { NaborEvent } from '../types';

export function EventCard({ event }: { event: NaborEvent }) {
  const { t, i18n } = useTranslation('events');
  const locale = i18n.resolvedLanguage;

  return (
    <Link
      to={`/events/${event.id}`}
      className="flex flex-col gap-2 rounded-lg border border-gray/30 p-4 hover:bg-gray/5"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-navy">{event.title}</h3>
        <EventStatusBadge status={event.status} />
      </div>

      {event.startsAt && (
        <p className="flex items-center gap-1.5 text-sm text-gray">
          <CalendarDays className="h-4 w-4" />
          {formatDateTime(event.startsAt, locale)}
        </p>
      )}

      <div className="mt-1 flex items-center justify-between">
        <span className="font-semibold text-navy">
          {event.costCents === 0 ? (
            <span className="text-success">{t('card.free')}</span>
          ) : (
            formatEuros(event.costCents, locale)
          )}
        </span>
        {event.maxParticipants != null && (
          <span className="flex items-center gap-1 text-xs text-gray">
            <Users className="h-3.5 w-3.5" />
            {t('card.capacity', { count: event.maxParticipants })}
          </span>
        )}
      </div>
    </Link>
  );
}
