import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { ListingCard } from '../components/ListingCard';
import { useListings } from '../hooks/useListings';

// ⚠️ Aucun filtre « créateur » n'existe sur GET /listings → on filtre côté
// client par creatorId. Limite : ne couvre que la page chargée (limit 100).
export function MyListingsPage() {
  const { t } = useTranslation('listings');
  const { user } = useAuth();
  const { data, isLoading } = useListings({ limit: 100 });

  const mine = (data?.data ?? []).filter((l) => l.creatorId === user?.id);

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-surface p-6">
      <h1 className="mb-6 text-xl font-bold text-fg">{t('mine.title')}</h1>
      {isLoading && <p className="text-gray">…</p>}
      {!isLoading && mine.length === 0 && <p className="text-gray">{t('mine.empty')}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {mine.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
