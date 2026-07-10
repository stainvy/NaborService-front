import { api } from '@/lib/api';
import type {
  ModerationAction,
  ModerationActionType,
  ReportedListingsResponse,
  ReportedEventsResponse,
} from '@/types/admin';
import type { PageParams } from '@/types/pagination';

export const moderationService = {
  // --- Listings ---
  // GET /listings/reported -> ReportedListingsResponseDto { data, total } (confirmé /api-json).

  getReportedListings(params?: PageParams): Promise<ReportedListingsResponse> {
    return api.get<ReportedListingsResponse>('/listings/reported', { params }).then((r) => r.data);
  },

  getListingModeratedActions(params?: PageParams): Promise<ModerationAction[]> {
    return api.get<ModerationAction[]>('/listings/moderated_actions', { params }).then((r) => r.data);
  },

  moderateListing(id: string, action: ModerationActionType, reason: string): Promise<void> {
    return api.post(`/listings/${id}/moderate`, { action, reason }).then(() => undefined);
  },

  getListingModerationHistory(id: string): Promise<ModerationAction[]> {
    return api.get<ModerationAction[]>(`/listings/${id}/moderation`).then((r) => r.data);
  },

  // --- Events ---
  // GET /events/reported -> ReportedEventsResponseDto { items, total } (confirmé /api-json,
  // clé "items" et pas "data" — asymétrique avec les listings).

  getReportedEvents(params?: PageParams): Promise<ReportedEventsResponse> {
    return api.get<ReportedEventsResponse>('/events/reported', { params }).then((r) => r.data);
  },

  getEventModeratedActions(params?: PageParams): Promise<ModerationAction[]> {
    return api.get<ModerationAction[]>('/events/moderated_actions', { params }).then((r) => r.data);
  },

  moderateEvent(id: string, action: ModerationActionType, reason: string): Promise<void> {
    return api.post(`/events/${id}/moderate`, { action, reason }).then(() => undefined);
  },

  getEventModerationHistory(id: string): Promise<ModerationAction[]> {
    return api.get<ModerationAction[]>(`/events/${id}/moderation`).then((r) => r.data);
  },
};
