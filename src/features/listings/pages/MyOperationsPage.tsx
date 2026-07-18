import { useTranslation } from 'react-i18next';
import { ListingCard } from '../components/ListingCard';
import { useMyOperations } from '../hooks/useListings';

// Annonces où l'utilisateur courant est partie prenante d'une transaction
// (provider ou requester), quel que soit le statut.
export function MyOperationsPage() {
  const { t } = useTranslation('listings');
  const { data, isLoading } = useMyOperations({ limit: 100 });

  const operations = data?.data ?? [];

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-6">
      <h1 className="mb-6 text-xl font-bold text-navy">{t('operations.title')}</h1>
      {isLoading && <p className="text-gray">…</p>}
      {!isLoading && operations.length === 0 && (
        <p className="text-gray">{t('operations.empty')}</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {operations.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
