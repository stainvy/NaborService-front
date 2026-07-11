import { api } from '@/lib/api';
import type {
  ModerationAction,
  ModerationActionType,
  ReportedListingItem,
  ReportedEventItem,
} from '@/types/admin';
import type { Paginated, PageParams } from '@/types/pagination';

export const moderationService = {
  // --- Listings ---
  // GET /listings/reported -> Paginated<ReportedListingItem> { data, meta } (confirmé /api-json).

  getReportedListings(params?: PageParams): Promise<Paginated<ReportedListingItem>> {
    return api.get<Paginated<ReportedListingItem>>('/listings/reported', { params }).then((r) => r.data);
  },

  getListingModeratedActions(params?: PageParams): Promise<Paginated<ModerationAction>> {
    return api.get<Paginated<ModerationAction>>('/listings/moderated_actions', { params }).then((r) => r.data);
  },

  moderateListing(id: string, action: ModerationActionType, reason: string): Promise<void> {
    return api.post(`/listings/${id}/moderate`, { action, reason }).then(() => undefined);
  },

  getListingModerationHistory(id: string): Promise<ModerationAction[]> {
    return api.get<ModerationAction[]>(`/listings/${id}/moderation`).then((r) => r.data);
  },

  // --- Events ---
  // GET /events/reported -> Paginated<ReportedEventItem> { data, meta } (confirmé /api-json —
  // la clé est désormais "data" pour les deux endpoints, plus d'asymétrie avec listings).

  getReportedEvents(params?: PageParams): Promise<Paginated<ReportedEventItem>> {
    return api.get<Paginated<ReportedEventItem>>('/events/reported', { params }).then((r) => r.data);
  },

  getEventModeratedActions(params?: PageParams): Promise<Paginated<ModerationAction>> {
    return api.get<Paginated<ModerationAction>>('/events/moderated_actions', { params }).then((r) => r.data);
  },

  moderateEvent(id: string, action: ModerationActionType, reason: string): Promise<void> {
    return api.post(`/events/${id}/moderate`, { action, reason }).then(() => undefined);
  },

  getEventModerationHistory(id: string): Promise<ModerationAction[]> {
    return api.get<ModerationAction[]>(`/events/${id}/moderation`).then((r) => r.data);
  },
};
