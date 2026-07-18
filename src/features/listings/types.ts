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

export type ListingFilterStatus = ListingStatus | 'all';

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
  status?: ListingFilterStatus;
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

// GET /listings/:id/contract/status — état de signature du contrat courant.
// 404 tant qu'aucun contrat n'a été généré (avant acceptation de l'intérêt).
export interface ContractStatus {
  documentId: string;
  myRole: 'provider' | 'requester' | null;
  iSigned: boolean;
  providerSignedAt: string | null;
  requesterSignedAt: string | null;
  fullySigned: boolean;
  signedAt: string | null;
  hasSignedPdf: boolean;
  providerName: string;
  requesterName: string;
  sha256Hash: string;
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

// GET /listings/:id/media — photos existantes de l'annonce, triées par `order`.
export interface ListingMediaItem {
  id: string;
  order: number | null;
  caption: string | null;
}
