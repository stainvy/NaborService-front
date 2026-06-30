export type ListingType = 'offer' | 'request';

export type ListingStatus = 'open' | 'pending' | 'in_progress' | 'closed' | 'cancelled';

/** Miroir de l'entité `Listing` (NaborService-api) telle que sérialisée par l'API. */
export interface Listing {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  categoryId: number | null;
  listingType: ListingType;
  priceCents: number;
  status: ListingStatus;
}
