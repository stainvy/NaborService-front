import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { EventFilters } from '../components/EventFilters';
import { EventCard } from '../components/EventCard';
import { useEvents } from '../hooks/useEvents';
import type { EventFilters as Filters } from '../types';

const LIMIT = 20;

export function EventsFeedPage() {
  const { t } = useTranslation('events');
  // Par défaut, on n'affiche que les événements à venir (upcoming=true).
  const [filters, setFilters] = useState<Filters>({ offset: 0, limit: LIMIT, upcoming: true });
  const { data, isLoading, isError } = useEvents(filters);

  const offset = filters.offset ?? 0;
  const total = data?.meta?.total ?? 0;
  const setOffset = (next: number) => setFilters((f) => ({ ...f, offset: next }));

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-fg">{t('feed.title')}</h1>
        <div className="flex gap-2">
          <Link to="/my-registrations" className="self-center text-sm text-orange underline">
            {t('feed.registrations')}
          </Link>
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
          <EventCard key={event.id} event={event} />
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
