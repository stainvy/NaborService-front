// ⚠️ Convention mixte confirmée en direct sur le back :
// - corps de REQUÊTE en snake_case (listing_type, price_cents, body_html…),
// - corps de RÉPONSE en camelCase (creatorId, listingType, priceCents…).
// On respecte exactement, on ne normalise rien.
//
// Le type Listing (entité API) vit dans src/types/listing.ts (source de vérité,
// partagée avec la page paiement Stripe) ; on le ré-exporte ici par commodité.
import type { Listing, ListingStatus, ListingType } from '@/types/listing';
import type { Paginated } from '@/types/pagination';

export type { Listing, ListingStatus, ListingType };

export const LISTING_TYPES: ListingType[] = ['offer', 'request'];
export const LISTING_STATUSES: ListingStatus[] = [
  'open',
  'pending',
  'in_progress',
  'closed',
  'cancelled',
];

// GET /listings → { data, meta: { total, offset, limit } } (wrapper de pagination
// standard du back, confirmé en live).
export type ListingsPage = Paginated<Listing>;

// GET /listings/:id/content — contenu enrichi MongoDB. body_html à passer par
// DOMPurify avant rendu. Forme non figée côté back (champs additionnels possibles).
export interface ListingContent {
  body_html?: string;
  tags?: string[];
  [key: string]: unknown;
}

// Filtres de liste (query string).
export interface ListingFilters {
  offset?: number;
  limit?: number;
  neighbourhood?: string;
  category?: number;
  type?: ListingType;
  status?: ListingStatus;
}

// --- Corps de requête (snake_case, NE PAS normaliser) ---------------------
export interface CreateListingPayload {
  title: string;
  listing_type: ListingType;
  description?: string;
  category_id?: number;
  price_cents?: number;
  neighbourhood_id?: string;
}

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  category_id?: number;
  price_cents?: number;
  neighbourhood_id?: string;
}

export interface UpdateContentPayload {
  body_html?: string;
  tags?: string[];
}

export interface CancelListingPayload {
  reason: string;
}

export interface ReportListingPayload {
  reason: string;
}

export interface SignDocumentPayload {
  canvas_b64: string;
  totp_code: string;
}

// --- Modération -----------------------------------------------------------
export type ModerationAction = 'cancelled' | 'warned' | 'restored';
export const MODERATION_ACTIONS: ModerationAction[] = ['cancelled', 'warned', 'restored'];

export interface ModerateListingPayload {
  action: ModerationAction;
  reason: string;
}

// Historique de modération — forme non documentée par Swagger (type tolérant).
export interface ModerationEntry {
  id?: string;
  listingId?: string;
  action?: ModerationAction;
  reason?: string;
  moderatorId?: string;
  createdAt?: string;
  [key: string]: unknown;
}

// GET /listings/:id/chat — groupe de messagerie lié (forme non figée).
export interface ListingChatGroup {
  id?: string;
  [key: string]: unknown;
}

// ⚠️ Le détail d'annonce sondé n'exposait pas de tableau média (annonce sans
// photo). L'endroit exact où le back référence les médias n'est pas confirmé →
// on lit défensivement plusieurs emplacements possibles (annonce ET contenu).
export function listingMediaIds(listing?: Listing, content?: ListingContent): string[] {
  const collect = (value: unknown): string[] =>
    Array.isArray(value)
      ? value
          .map((item) =>
            typeof item === 'string'
              ? item
              : ((item as Record<string, unknown>)?.id ??
                (item as Record<string, unknown>)?.media_id),
          )
          .filter((v): v is string => typeof v === 'string')
      : [];

  const l = listing as Record<string, unknown> | undefined;
  const c = content as Record<string, unknown> | undefined;
  return [
    ...collect(l?.media),
    ...collect(l?.photos),
    ...collect(c?.media),
    ...collect(c?.photos),
    ...collect(c?.media_ids),
  ];
}
