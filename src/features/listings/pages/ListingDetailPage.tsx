import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { useAuth } from '@/hooks/useAuth';
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
import { usePointsBalance, usePayListing } from '../hooks/usePayment';
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

  // Paiement EN POINTS : l'acheteur (non-créateur) règle l'annonce en cours
  // avec son solde de points. On ne charge le solde que si c'est pertinent.
  const canPay =
    listing?.status === 'in_progress' &&
    (listing?.priceCents ?? 0) > 0 &&
    listing?.creatorId !== user?.id;
  const balance = usePointsBalance(Boolean(canPay));
  const pay = usePayListing(id);

  if (isLoading || !listing) return <FullPageLoader />;

  const isCreator = listing.creatorId === user?.id;
  const mediaIds = listingMediaIds(listing, content);
  const safeHtml = content?.body_html ? DOMPurify.sanitize(content.body_html) : null;

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-white p-6">
      <Link to="/listings" className="text-sm text-orange underline">
        ← {t('feed.title')}
      </Link>

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

      {/* Paiement EN POINTS (transaction en cours, annonce payante, acheteur).
          ⚠️ Hypothèse 1 point = 1 centime (à confirmer avec l'équipe paiement). */}
      {canPay &&
        (() => {
          const bal = balance.data?.pointsBalance;
          const insufficient = bal !== undefined && bal < listing.priceCents;
          return (
            <section className="mt-6 rounded-md border border-gray/30 p-4">
              <p className="text-sm text-gray">
                {t('payment.balance', { points: bal ?? 0 })}
              </p>
              <p className="mt-1 text-sm text-navy">
                {t('payment.price', { points: listing.priceCents })}
              </p>
              <Button
                className="mt-3"
                onClick={() => pay.mutate()}
                disabled={pay.isPending || insufficient}
              >
                {t('payment.pay_button')}
              </Button>
              {insufficient && (
                <p className="mt-1 text-sm text-error">{t('payment.insufficient')}</p>
              )}
              {pay.isError && <p className="mt-1 text-sm text-error">{t('payment.error')}</p>}
              {pay.isSuccess && <p className="mt-1 text-sm text-success">{t('payment.paid')}</p>}
            </section>
          );
        })()}

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
