import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ListingForm } from '../components/ListingForm';
import { useCreateListing } from '../hooks/useListingMutations';

export function ListingCreatePage() {
  const { t } = useTranslation('listings');
  const navigate = useNavigate();
  const create = useCreateListing();

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-surface p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-fg">{t('create.title')}</h1>
        <p className="mt-1 text-sm text-gray">{t('create.subtitle')}</p>
      </div>

      {create.isError && (
        <p className="mb-4 rounded-md bg-error/10 px-3 py-2 text-sm text-error">
          {t('create.error')}
        </p>
      )}

      <div className="rounded-lg border border-gray/30 p-5">
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
    </div>
  );
}
