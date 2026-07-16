import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { FullPageLoader } from '@/components/FullPageLoader';
import { ListingForm } from '../components/ListingForm';
import { ListingMedia } from '../components/ListingMedia';
import { useListing, useListingContent } from '../hooks/useListings';
import { useUpdateContent, useUpdateListing } from '../hooks/useListingMutations';
import { centsToEuros } from '@/lib/money';
import { listingMediaIds } from '../types';

export function ListingEditPage() {
  const { t } = useTranslation('listings');
  const { listingId: id = '' } = useParams();

  const { data: listing, isLoading } = useListing(id);
  const { data: content } = useListingContent(id);
  const update = useUpdateListing(id);
  const updateContent = useUpdateContent(id);

  const [bodyHtml, setBodyHtml] = useState('');
  const [tags, setTags] = useState('');

  // Pré-remplit l'éditeur de contenu une fois chargé.
  useEffect(() => {
    if (content) {
      setBodyHtml(content.body_html ?? '');
      setTags((content.tags ?? []).join(', '));
    }
  }, [content]);

  if (isLoading || !listing) return <FullPageLoader />;

  const mediaIds = listingMediaIds(listing, content);

  const saveContent = (e: React.FormEvent) => {
    e.preventDefault();
    updateContent.mutate({
      body_html: bodyHtml || undefined,
      tags: tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-white p-6">
      <Link to={`/listings/${id}`} className="text-sm text-orange underline">
        ← {t('detail.back')}
      </Link>
      <h1 className="my-6 text-xl font-bold text-navy">{t('edit.title')}</h1>

      {/* Métadonnées */}
      <ListingForm
        submitLabel={t('edit.submit')}
        submitting={update.isPending}
        defaultValues={{
          title: listing.title,
          listing_type: listing.listingType,
          description: listing.description ?? undefined,
          category_id: listing.categoryId ?? undefined,
          neighbourhood_id: listing.neighbourhoodId ?? undefined,
          price_euros: centsToEuros(listing.priceCents),
        }}
        onSubmit={(payload) =>
          // PATCH /listings/:id n'accepte pas listing_type → on l'omet.
          update.mutate({
            title: payload.title,
            description: payload.description,
            category_id: payload.category_id,
            neighbourhood_id: payload.neighbourhood_id,
            price_cents: payload.price_cents,
          })
        }
      />
      {update.isSuccess && <p className="mt-2 text-sm text-success">{t('edit.saved')}</p>}

      {/* Contenu enrichi */}
      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-navy">{t('edit.content_title')}</h2>
        <form onSubmit={saveContent} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-navy">{t('edit.body_html')}</span>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={5}
              className="rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-navy">{t('edit.tags')}</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t('edit.tags_hint')}
              className="rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
            />
          </label>
          <Button type="submit" disabled={updateContent.isPending}>
            {t('edit.save_content')}
          </Button>
          {updateContent.isSuccess && (
            <p className="text-sm text-success">{t('edit.content_saved')}</p>
          )}
        </form>
      </section>

      {/* Photos */}
      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-navy">{t('edit.photos')}</h2>
        <ListingMedia id={id} mediaIds={mediaIds} editable />
      </section>
    </div>
  );
}
