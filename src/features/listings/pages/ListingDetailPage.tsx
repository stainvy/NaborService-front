import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { useAuth } from '@/hooks/useAuth';
import { stripeService } from '@/services/stripe.service';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { FullPageLoader } from '@/components/FullPageLoader';
import { StatusBadge } from '../components/StatusBadge';
import { PriceTag } from '../components/PriceTag';
import { LifecycleActions } from '../components/LifecycleActions';
import { ListingMedia } from '../components/ListingMedia';
import { useListing, useListingContent } from '../hooks/useListings';
import { useListingStatusSocket } from '../hooks/useListingStatusSocket';
import { useReportListing } from '../hooks/useReportListing';
import { useDeleteListing } from '../hooks/useListingMutations';
import { useDownloadContract, useDownloadReceipt } from '../hooks/useDocuments';
import { useListingChat } from '../hooks/useListingChat';
import { listingMediaIds } from '../types';

export function ListingDetailPage() {
  const { t } = useTranslation('listings');
  // Route /listings/:listingId (le retour de paiement Stripe cible cette URL).
  const { listingId: id = '' } = useParams();
  const { user } = useAuth();

  const { data: listing, isLoading } = useListing(id);
  const { data: content } = useListingContent(id);
  useListingStatusSocket(id);

  const report = useReportListing(id);
  const remove = useDeleteListing();
  const contract = useDownloadContract(id);
  const receipt = useDownloadReceipt(id);

  const transactionLive = listing?.status === 'in_progress' || listing?.status === 'closed';
  const chat = useListingChat(id, transactionLive);

  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');

  // Paiement Stripe (géré par l'équipe paiement) : bouton + retour ?payment=.
  const [searchParams] = useSearchParams();
  const paymentResult = searchParams.get('payment');
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handlePay = async () => {
    setIsPaying(true);
    setPayError(null);
    try {
      const { url } = await stripeService.createCheckoutSession(id);
      window.location.href = url;
    } catch {
      setPayError(t('errors.checkout_failed'));
      setIsPaying(false);
    }
  };

  if (isLoading || !listing) return <FullPageLoader />;

  const isCreator = listing.creatorId === user?.id;
  const mediaIds = listingMediaIds(listing, content);
  const safeHtml = content?.body_html ? DOMPurify.sanitize(content.body_html) : null;

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-white p-6">
      <Link to="/listings" className="text-sm text-orange underline">
        ← {t('feed.title')}
      </Link>

      {/* Retour de paiement Stripe */}
      {paymentResult === 'success' && (
        <p className="mt-4 rounded-md bg-success/10 p-3 text-sm text-success">
          {t('payment.success')}
        </p>
      )}
      {paymentResult === 'cancel' && (
        <p className="mt-4 rounded-md bg-gray/10 p-3 text-sm text-gray">{t('payment.cancel')}</p>
      )}

      <header className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{listing.title}</h1>
          <p className="mt-1 text-xs uppercase tracking-wide text-gray">
            {t(`type.${listing.listingType}`)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={listing.status} />
          <PriceTag cents={listing.priceCents} />
        </div>
      </header>

      {listing.description && (
        <p className="mt-4 whitespace-pre-line text-gray">{listing.description}</p>
      )}

      {/* Contenu enrichi MongoDB — assaini par DOMPurify avant rendu. */}
      {safeHtml && (
        <div
          className="prose mt-4 max-w-none text-navy"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      )}

      {content?.tags && content.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {content.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-gray/15 px-2 py-0.5 text-xs text-gray">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {mediaIds.length > 0 && (
        <section className="mt-6">
          <ListingMedia id={id} mediaIds={mediaIds} />
        </section>
      )}

      {/* Actions du cycle de vie selon le rôle */}
      <section className="mt-6">
        <LifecycleActions listing={listing} isCreator={isCreator} />
      </section>

      {/* Discussion liée */}
      {chat.data && (
        <section className="mt-6">
          <Button variant="secondary" disabled>
            {t('chat.open')}
          </Button>
          <p className="mt-1 text-xs text-gray">{t('chat.coming_soon')}</p>
        </section>
      )}

      {/* Paiement Stripe : dispo quand la transaction est en cours et payante */}
      {listing.status === 'in_progress' && listing.priceCents > 0 && (
        <section className="mt-6">
          <Button onClick={handlePay} disabled={isPaying}>
            {isPaying ? t('payment.loading') : t('payment.pay_button')}
          </Button>
          {payError && <p className="mt-1 text-sm text-error">{payError}</p>}
        </section>
      )}

      {/* Documents & signature */}
      <section className="mt-6 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => contract.mutate()} disabled={contract.isPending}>
          {t('documents.contract')}
        </Button>
        <Button variant="secondary" onClick={() => receipt.mutate()} disabled={receipt.isPending}>
          {t('documents.receipt')}
        </Button>
        <Link to={`/listings/${id}/sign`}>
          <Button>{t('documents.sign')}</Button>
        </Link>
      </section>

      {/* Créateur : édition / suppression */}
      {isCreator && (
        <section className="mt-6 flex gap-2">
          <Link to={`/listings/${id}/edit`}>
            <Button variant="secondary">{t('detail.edit')}</Button>
          </Link>
          <Button variant="secondary" onClick={() => remove.mutate(id)} disabled={remove.isPending}>
            {t('detail.delete')}
          </Button>
        </section>
      )}

      {/* Signalement (non-créateur) */}
      {!isCreator && (
        <section className="mt-6">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="text-sm font-semibold text-error underline"
          >
            {t('report.action')}
          </button>
        </section>
      )}

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t('report.title')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            report.mutate({ reason }, { onSuccess: () => setReportOpen(false) });
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-navy">{t('report.reason')}</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
            />
          </label>
          {report.isSuccess && <p className="text-sm text-success">{t('report.done')}</p>}
          <Button type="submit" disabled={report.isPending || reason.trim().length === 0}>
            {t('report.submit')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
