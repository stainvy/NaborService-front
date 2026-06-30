import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { Button } from '@/components/Button';
import { FullPageLoader } from '@/components/FullPageLoader';
import { listingsService } from '@/services/listings.service';
import { stripeService } from '@/services/stripe.service';
import type { Listing } from '@/types/listing';

/** Annonce + paiement Stripe : la page sur laquelle Stripe redirige après le checkout. */
export function ListingPage() {
  const { t } = useTranslation('listings');
  const { listingId } = useParams<{ listingId: string }>();
  const [searchParams] = useSearchParams();
  const payment = searchParams.get('payment');

  const [listing, setListing] = useState<Listing | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) return;
    listingsService
      .getById(listingId)
      .then(setListing)
      .catch((err: unknown) => {
        const message =
          isAxiosError(err) && err.response?.status === 404
            ? t('errors.not_found')
            : t('errors.load_failed');
        setLoadError(message);
      });
  }, [listingId, t]);

  const handlePay = async () => {
    if (!listingId) return;
    setIsPaying(true);
    setPayError(null);
    try {
      const { url } = await stripeService.createCheckoutSession(listingId);
      window.location.href = url;
    } catch {
      setPayError(t('errors.checkout_failed'));
      setIsPaying(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6">
        <p className="text-gray">{loadError}</p>
        <Link to="/" className="text-orange underline">
          {t('back_home')}
        </Link>
      </div>
    );
  }

  if (!listing) return <FullPageLoader />;

  return (
    <div className="mx-auto max-w-lg p-6">
      {payment === 'success' && (
        <p className="mb-4 rounded-md bg-green-100 p-3 text-sm text-green-800">
          {t('payment.success')}
        </p>
      )}
      {payment === 'cancel' && (
        <p className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-800">
          {t('payment.cancel')}
        </p>
      )}

      <h1 className="text-xl font-bold text-navy">{listing.title}</h1>
      {listing.description && <p className="mt-2 text-gray">{listing.description}</p>}
      <p className="mt-4 text-2xl font-bold text-navy">
        {(listing.priceCents / 100).toFixed(2)} €
      </p>

      {listing.status === 'in_progress' && (
        <Button onClick={() => void handlePay()} disabled={isPaying} className="mt-6">
          {isPaying ? t('payment.loading') : t('payment.pay_button')}
        </Button>
      )}
      {payError && <p className="mt-2 text-sm text-red-800">{payError}</p>}
    </div>
  );
}
