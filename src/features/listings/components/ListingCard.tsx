import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mediaUrl } from '@/lib/media';
import { StatusBadge } from './StatusBadge';
import { PriceTag } from './PriceTag';
import type { Listing } from '../types';

export function ListingCard({ listing }: { listing: Listing }) {
  const { t } = useTranslation('listings');
  const cover = mediaUrl(listing.coverMediaId);
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="flex flex-col gap-2 rounded-lg border border-gray/30 p-4 transition hover:border-navy/40 hover:shadow-sm"
    >
      {cover && (
        <img
          src={cover}
          alt=""
          className="-mx-4 -mt-4 mb-1 h-32 w-[calc(100%+2rem)] rounded-t-lg object-cover"
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <span className="inline-block w-fit rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-navy">
          {t(`type.${listing.listingType}`)}
        </span>
        <StatusBadge status={listing.status} />
      </div>
      <h3 className="font-semibold text-navy">{listing.title}</h3>
      {listing.description && (
        <p className="line-clamp-2 text-sm text-gray">{listing.description}</p>
      )}
      {listing.creator && (
        <p className="text-xs text-gray">
          {t('card.by', { name: `${listing.creator.firstName} ${listing.creator.lastName}` })}
        </p>
      )}
      <div className="mt-1">
        <PriceTag cents={listing.priceCents} />
      </div>
    </Link>
  );
}
