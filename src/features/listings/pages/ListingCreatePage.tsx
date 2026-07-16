import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ListingForm } from '../components/ListingForm';
import { useCreateListing } from '../hooks/useListingMutations';

export function ListingCreatePage() {
  const { t } = useTranslation('listings');
  const navigate = useNavigate();
  const create = useCreateListing();

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-white p-6">
      <h1 className="mb-6 text-xl font-bold text-navy">{t('create.title')}</h1>
      {create.isError && <p className="mb-4 text-sm text-error">{t('create.error')}</p>}
      <ListingForm
        submitLabel={t('create.submit')}
        submitting={create.isPending}
        onSubmit={(payload) =>
          // Après création, on enchaîne sur l'édition (photos + contenu enrichi).
          create.mutate(payload, {
            onSuccess: (listing) => navigate(`/listings/${listing.id}/edit`),
          })
        }
      />
    </div>
  );
}
