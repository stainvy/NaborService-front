export type ListingType = 'offer' | 'request';

export type ListingStatus = 'open' | 'pending' | 'in_progress' | 'closed' | 'cancelled';

/**
 * Miroir de l'entité `Listing` (NaborService-api) telle que sérialisée par l'API.
 * Réponse en camelCase ; les corps de requête, eux, restent en snake_case
 * (cf. DTOs dans features/listings/types.ts). Champs optionnels + index
 * signature pour tolérer les variations de sérialisation entre endpoints.
 */
export interface Listing {
  id: string;
  creatorId?: string;
  title: string;
  description?: string | null;
  categoryId?: number | null;
  listingType: ListingType;
  priceCents: number;
  status: ListingStatus;
  neighbourhoodId?: string | null;
  mongoDocumentId?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  closedAt?: string | null;
  deletedAt?: string | null;
  [key: string]: unknown;
}
