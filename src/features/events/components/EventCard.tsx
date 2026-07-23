import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Users, ThumbsUp, ThumbsDown } from 'lucide-react';
import { mediaUrl } from '@/lib/media';
import { EventStatusBadge } from './EventStatusBadge';
import { useSwipeEvent } from '../hooks/useEventParticipation';
import { formatDateTime, eventPoints } from '../format';
import { isPastEvent } from '../utils';
import type { EventSwipeDirection, NaborEvent } from '../types';

export function EventCard({ event }: { event: NaborEvent }) {
  const { t, i18n } = useTranslation('events');
  const locale = i18n.resolvedLanguage;
  const past = isPastEvent(event);
  const cover = mediaUrl(event.coverMediaId);

  const swipe = useSwipeEvent();
  const [swiped, setSwiped] = useState<EventSwipeDirection | null>(event.userSwipe ?? null);
  const onSwipe = (direction: EventSwipeDirection) => {
    if (direction === swiped || swipe.isPending) return;
    const previous = swiped;
    setSwiped(direction);
    swipe.mutate({ id: event.id, direction }, { onError: () => setSwiped(previous) });
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray/30 p-4">
      <Link to={`/events/${event.id}`} className="flex flex-col gap-2 hover:opacity-90">
        {cover && (
          <img
            src={cover}
            alt=""
            className="-mx-4 -mt-4 mb-1 h-32 w-[calc(100%+2rem)] rounded-t-lg object-cover"
          />
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-fg">{event.title}</h3>
          {past ? (
            <span className="inline-block rounded-full bg-gray/20 px-2 py-0.5 text-xs font-medium text-gray">
              {t('status.past')}
            </span>
          ) : (
            <EventStatusBadge status={event.status} />
          )}
        </div>

        {event.startsAt && (
          <p className="flex items-center gap-1.5 text-sm text-gray">
            <CalendarDays className="h-4 w-4" />
            {formatDateTime(event.startsAt, locale)}
          </p>
        )}

        <div className="mt-1 flex items-center justify-between">
          <span className="font-semibold text-fg">
            {event.costCents === 0 ? (
              <span className="text-success">{t('card.free')}</span>
            ) : (
              t('card.points', { points: eventPoints(event) })
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

      {/* Swipe d'intérêt — masqué pour un événement passé (aucun sens). */}
      {!past && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSwipe('like')}
            disabled={swipe.isPending || swiped === 'like'}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
              swiped === 'like'
                ? 'border-success text-success'
                : 'border-gray/40 text-gray hover:border-success hover:text-success'
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" /> {t('feed.like')}
          </button>
          <button
            type="button"
            onClick={() => onSwipe('dislike')}
            disabled={swipe.isPending || swiped === 'dislike'}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
              swiped === 'dislike'
                ? 'border-error text-error'
                : 'border-gray/40 text-gray hover:border-error hover:text-error'
            }`}
          >
            <ThumbsDown className="h-3.5 w-3.5" /> {t('feed.dislike')}
          </button>
        </div>
      )}
    </div>
  );
}
