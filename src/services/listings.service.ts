import { api } from '@/lib/api';
import type { Listing } from '@/types/listing';
import type {
  CancelListingPayload,
  CreateListingPayload,
  ListingChatGroup,
  ListingContent,
  ListingFilters,
  ListingsPage,
  ReportListingPayload,
  SignDocumentPayload,
  UpdateContentPayload,
  UpdateListingPayload,
} from '@/features/listings/types';

// Les DTOs de requête vivent dans features/listings/types ; on les ré-exporte
// ici car l'API explorer (admin) les importe depuis ce service.
export type { CreateListingPayload, UpdateListingPayload } from '@/features/listings/types';

// Service du domaine « listings ». Seul endroit qui connaît ces URLs.
// Corps de requête en snake_case (NE PAS normaliser) ; réponses en camelCase.
export const listingsService = {
  // --- Liste & détail -------------------------------------------------------
  // Tolérant : l'API renvoie { data, meta } (confirmé en live) ; on gère aussi
  // le cas d'un tableau nu par sécurité.
  list(filters?: ListingFilters): Promise<ListingsPage> {
    return api.get<Listing[] | ListingsPage>('/listings', { params: filters }).then((r) => {
      const d = r.data;
      if (Array.isArray(d)) {
        return { data: d, meta: { total: d.length, offset: 0, limit: d.length } };
      }
      return d;
    });
  },

  get(id: string): Promise<Listing> {
    return api.get<Listing>(`/listings/${id}`).then((r) => r.data);
  },

  // Alias historique (utilisé par l'API explorer / la page de retour paiement).
  getById(listingId: string): Promise<Listing> {
    return listingsService.get(listingId);
  },

  getContent(id: string): Promise<ListingContent> {
    return api.get<ListingContent>(`/listings/${id}/content`).then((r) => r.data);
  },

  // --- Création & édition ---------------------------------------------------
  create(payload: CreateListingPayload): Promise<Listing> {
    return api.post<Listing>('/listings', payload).then((r) => r.data);
  },

  update(id: string, payload: UpdateListingPayload): Promise<Listing> {
    return api.patch<Listing>(`/listings/${id}`, payload).then((r) => r.data);
  },

  updateContent(id: string, payload: UpdateContentPayload): Promise<ListingContent> {
    return api.patch<ListingContent>(`/listings/${id}/content`, payload).then((r) => r.data);
  },

  remove(id: string): Promise<void> {
    return api.delete(`/listings/${id}`).then(() => undefined);
  },

  // Alias attendu par l'API explorer (admin).
  delete(id: string): Promise<void> {
    return listingsService.remove(id);
  },

  // --- Médias (multipart, champ « file ») -----------------------------------
  uploadMedia(id: string, file: File): Promise<{ mediaId: string }> {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ mediaId: string }>(`/listings/${id}/media`, form).then((r) => r.data);
  },

  deleteMedia(id: string, mediaId: string): Promise<void> {
    return api.delete(`/listings/${id}/media/${mediaId}`).then(() => undefined);
  },

  // --- Cycle de vie ---------------------------------------------------------
  expressInterest(id: string): Promise<Listing> {
    return api.post<Listing>(`/listings/${id}/interest`).then((r) => r.data);
  },

  accept(id: string): Promise<Listing> {
    return api.post<Listing>(`/listings/${id}/accept`).then((r) => r.data);
  },

  // Paiement de l'annonce EN POINTS (débite le solde). Cycle de vie :
  // interest → accept → pay → confirm. (L'ancien checkout Stripe par annonce a
  // été supprimé côté back ; Stripe ne sert plus qu'à recharger les points.)
  pay(id: string): Promise<Listing> {
    return api.post<Listing>(`/listings/${id}/pay`).then((r) => r.data);
  },

  confirm(id: string): Promise<Listing> {
    return api.post<Listing>(`/listings/${id}/confirm`).then((r) => r.data);
  },

  cancel(id: string, payload: CancelListingPayload): Promise<Listing> {
    return api.post<Listing>(`/listings/${id}/cancel`, payload).then((r) => r.data);
  },

  // --- Discussion liée ------------------------------------------------------
  getChat(id: string): Promise<ListingChatGroup> {
    return api.get<ListingChatGroup>(`/listings/${id}/chat`).then((r) => r.data);
  },

  // --- Documents (PDF) & signature ------------------------------------------
  downloadContract(id: string): Promise<Blob> {
    return api
      .get(`/listings/${id}/contract`, { responseType: 'blob' })
      .then((r) => r.data as Blob);
  },

  downloadReceipt(id: string): Promise<Blob> {
    return api.get(`/listings/${id}/receipt`, { responseType: 'blob' }).then((r) => r.data as Blob);
  },

  sign(id: string, payload: SignDocumentPayload): Promise<unknown> {
    return api.post(`/listings/${id}/sign`, payload).then((r) => r.data);
  },

  // --- Signalement ----------------------------------------------------------
  report(id: string, payload: ReportListingPayload): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/listings/${id}/report`, payload).then((r) => r.data);
  },
};
