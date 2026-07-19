import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/Button';
import { EventFilters } from '../components/EventFilters';
import { EventCard } from '../components/EventCard';
import { useEvents } from '../hooks/useEvents';
import { useSwipeEvent } from '../hooks/useEventParticipation';
import type { EventFilters as Filters, EventSwipeDirection } from '../types';

const LIMIT = 20;

export function EventsFeedPage() {
  const { t } = useTranslation('events');
  const [filters, setFilters] = useState<Filters>({ offset: 0, limit: LIMIT });
  const { data, isLoading, isError } = useEvents(filters);
  const swipe = useSwipeEvent();
  const [swiped, setSwiped] = useState<Record<string, EventSwipeDirection>>({});

  const offset = filters.offset ?? 0;
  const total = data?.meta?.total ?? 0;
  const setOffset = (next: number) => setFilters((f) => ({ ...f, offset: next }));

  const onSwipe = (id: string, direction: EventSwipeDirection) => {
    swipe.mutate({ id, direction });
    setSwiped((s) => ({ ...s, [id]: direction }));
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">{t('feed.title')}</h1>
        <div className="flex gap-2">
          <Link to="/my-events" className="self-center text-sm text-orange underline">
            {t('feed.mine')}
          </Link>
          <Link to="/events/new">
            <Button>{t('feed.create')}</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <EventFilters value={filters} onChange={setFilters} />
      </div>

      {isLoading && <p className="text-gray">…</p>}
      {isError && <p className="text-error">{t('feed.error')}</p>}
      {data && data.data.length === 0 && <p className="text-gray">{t('feed.empty')}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {data?.data.map((event) => (
          <div key={event.id} className="flex flex-col gap-2">
            <EventCard event={event} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSwipe(event.id, 'like')}
                disabled={Boolean(swiped[event.id])}
                aria-label={t('feed.like')}
                className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                  swiped[event.id] === 'like'
                    ? 'border-success text-success'
                    : 'border-gray/40 text-gray hover:border-success hover:text-success'
                }`}
              >
                <ThumbsUp className="h-3.5 w-3.5" /> {t('feed.like')}
              </button>
              <button
                type="button"
                onClick={() => onSwipe(event.id, 'dislike')}
                disabled={Boolean(swiped[event.id])}
                aria-label={t('feed.dislike')}
                className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                  swiped[event.id] === 'dislike'
                    ? 'border-error text-error'
                    : 'border-gray/40 text-gray hover:border-error hover:text-error'
                }`}
              >
                <ThumbsDown className="h-3.5 w-3.5" /> {t('feed.dislike')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {total > LIMIT && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="secondary"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
          >
            {t('feed.prev')}
          </Button>
          <span className="text-sm text-gray">
            {offset + 1}–{Math.min(offset + LIMIT, total)} / {total}
          </span>
          <Button
            variant="secondary"
            disabled={offset + LIMIT >= total}
            onClick={() => setOffset(offset + LIMIT)}
          >
            {t('feed.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
