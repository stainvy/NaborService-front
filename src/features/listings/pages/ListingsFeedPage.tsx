import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { ListingFilters } from '../components/ListingFilters';
import { ListingCard } from '../components/ListingCard';
import { useListings } from '../hooks/useListings';
import type { ListingFilters as Filters } from '../types';

const LIMIT = 20;

export function ListingsFeedPage() {
  const { t } = useTranslation('listings');
  const [filters, setFilters] = useState<Filters>({ offset: 0, limit: LIMIT });
  const { data, isLoading, isError } = useListings(filters);

  const offset = filters.offset ?? 0;
  const total = data?.meta?.total ?? 0;
  const setOffset = (next: number) => setFilters((f) => ({ ...f, offset: next }));

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">{t('feed.title')}</h1>
        <div className="flex gap-2">
          <Link to="/my-listings" className="self-center text-sm text-orange underline">
            {t('feed.mine')}
          </Link>
          <Link to="/listings/new">
            <Button>{t('feed.create')}</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <ListingFilters value={filters} onChange={setFilters} />
      </div>

      {isLoading && <p className="text-gray">…</p>}
      {isError && <p className="text-error">{t('feed.error')}</p>}

      {data && data.data.length === 0 && <p className="text-gray">{t('feed.empty')}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {data?.data.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
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
