import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from './StatusBadge';
import { PriceTag } from './PriceTag';
import type { Listing } from '../types';

export function ListingCard({ listing }: { listing: Listing }) {
  const { t } = useTranslation('listings');
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="flex flex-col gap-2 rounded-lg border border-gray/30 p-4 hover:bg-gray/5"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-navy">{listing.title}</h3>
        <StatusBadge status={listing.status} />
      </div>
      <p className="text-xs uppercase tracking-wide text-gray">
        {t(`type.${listing.listingType}`)}
      </p>
      {listing.description && (
        <p className="line-clamp-2 text-sm text-gray">{listing.description}</p>
      )}
      <PriceTag cents={listing.priceCents} />
    </Link>
  );
}
