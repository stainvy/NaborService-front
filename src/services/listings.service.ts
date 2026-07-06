import { api } from '@/lib/api';
import type { Listing } from '@/types/listing';

export interface CreateListingPayload {
  title: string;
  listing_type: 'offer' | 'request';
  description?: string;
  category_id?: number;
  price_cents?: number;
  neighbourhood_id?: string;
}

export interface UpdateListingPayload extends Partial<CreateListingPayload> {}

export const listingsService = {
  getById(listingId: string): Promise<Listing> {
    return api.get<Listing>(`/listings/${listingId}`).then((r) => r.data);
  },

  /** Feed annonces. */
  list(params?: Record<string, string>): Promise<Listing[]> {
    return api.get<Listing[]>('/listings', { params }).then((r) => r.data);
  },

  /** Créer une annonce. */
  create(payload: CreateListingPayload): Promise<Listing> {
    return api.post<Listing>('/listings', payload).then((r) => r.data);
  },

  /** Modifier une annonce. */
  update(listingId: string, payload: UpdateListingPayload): Promise<Listing> {
    return api.patch<Listing>(`/listings/${listingId}`, payload).then((r) => r.data);
  },

  /** Soft delete. */
  delete(listingId: string): Promise<void> {
    return api.delete(`/listings/${listingId}`).then(() => undefined);
  },

  /** Contenu enrichi HTML. */
  getContent(listingId: string): Promise<unknown> {
    return api.get(`/listings/${listingId}/content`).then((r) => r.data);
  },

  /** Modifier contenu enrichi. */
  updateContent(listingId: string, payload: { body_html?: string }): Promise<unknown> {
    return api.patch(`/listings/${listingId}/content`, payload).then((r) => r.data);
  },

  /** Annuler une annonce. */
  cancel(listingId: string, reason: string): Promise<void> {
    return api.post(`/listings/${listingId}/cancel`, { reason }).then(() => undefined);
  },

  // --- Media ---

  /** Upload photo (multipart, champ « file », max 8). */
  uploadMedia(listingId: string, file: File): Promise<{ mediaId: string }> {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/listings/${listingId}/media`, form).then((r) => r.data);
  },

  /** Supprimer une photo. */
  deleteMedia(listingId: string, mediaId: string): Promise<void> {
    return api.delete(`/listings/${listingId}/media/${mediaId}`).then(() => undefined);
  },
};
