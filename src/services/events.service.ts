import { api } from '@/lib/api';
import type {
  CreateEventPayload,
  EventChatGroup,
  EventContent,
  EventFilters,
  EventParticipant,
  EventsPage,
  EventSwipeDirection,
  NaborEvent,
  ReportEventPayload,
  UpdateEventContentPayload,
  UpdateEventPayload,
} from '@/features/events/types';

// Ré-export pour compat (types désormais dans features/events/types).
export type { NaborEvent, CreateEventPayload, UpdateEventPayload } from '@/features/events/types';

// Service du domaine « events ». Corps de requête en snake_case (NE PAS
// normaliser) ; réponses en camelCase. Routes vérifiées sur ~/NaborService-api.
export const eventsService = {
  // --- Liste & détail -------------------------------------------------------
  // GET /events → { data, meta } (tolérant à un éventuel tableau nu).
  list(filters?: EventFilters): Promise<EventsPage> {
    return api.get<NaborEvent[] | EventsPage>('/events', { params: filters }).then((r) => {
      const d = r.data;
      if (Array.isArray(d)) {
        return { data: d, meta: { total: d.length, offset: 0, limit: d.length } };
      }
      return d;
    });
  },

  create(payload: CreateEventPayload): Promise<NaborEvent> {
    return api.post<NaborEvent>('/events', payload).then((r) => r.data);
  },

  getById(eventId: string): Promise<NaborEvent> {
    return api.get<NaborEvent>(`/events/${eventId}`).then((r) => r.data);
  },

  update(eventId: string, payload: UpdateEventPayload): Promise<NaborEvent> {
    return api.patch<NaborEvent>(`/events/${eventId}`, payload).then((r) => r.data);
  },

  delete(eventId: string): Promise<void> {
    return api.delete(`/events/${eventId}`).then(() => undefined);
  },

  getContent(eventId: string): Promise<EventContent> {
    return api.get<EventContent>(`/events/${eventId}/content`).then((r) => r.data);
  },

  updateContent(eventId: string, payload: UpdateEventContentPayload): Promise<EventContent> {
    return api.patch<EventContent>(`/events/${eventId}/content`, payload).then((r) => r.data);
  },

  // --- Cycle de vie ---------------------------------------------------------
  publish(eventId: string): Promise<NaborEvent> {
    return api.post<NaborEvent>(`/events/${eventId}/publish`).then((r) => r.data);
  },

  open(eventId: string): Promise<NaborEvent> {
    return api.post<NaborEvent>(`/events/${eventId}/open`).then((r) => r.data);
  },

  complete(eventId: string): Promise<NaborEvent> {
    return api.post<NaborEvent>(`/events/${eventId}/complete`).then((r) => r.data);
  },

  // reason optionnel côté type (compat appelants existants) ; le back l'exige.
  cancel(eventId: string, reason?: string): Promise<NaborEvent> {
    return api.post<NaborEvent>(`/events/${eventId}/cancel`, { reason }).then((r) => r.data);
  },

  // --- Participants & liste d'attente (créateur/modérateur) -----------------
  getParticipants(eventId: string): Promise<EventParticipant[]> {
    return api.get<EventParticipant[]>(`/events/${eventId}/participants`).then((r) => r.data);
  },

  getWaitlist(eventId: string): Promise<EventParticipant[]> {
    return api.get<EventParticipant[]>(`/events/${eventId}/waitlist`).then((r) => r.data);
  },

  // Inscription ASYNCHRONE : le back répond 202 ; le résultat arrive par Socket
  // (event:registration_result / event:registration_failed).
  register(eventId: string): Promise<void> {
    return api.post(`/events/${eventId}/register`).then(() => undefined);
  },

  unregister(eventId: string): Promise<void> {
    return api.delete(`/events/${eventId}/participants/me`).then(() => undefined);
  },

  // --- Médias (multipart, champ « file ») -----------------------------------
  uploadMedia(
    eventId: string,
    file: File,
  ): Promise<{
    type: 'cover' | 'attachment';
    name?: string;
    mimetype: string;
    size_bytes: number;
  }> {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/events/${eventId}/media`, form).then((r) => r.data);
  },

  deleteMedia(eventId: string, filename: string): Promise<void> {
    return api
      .delete(`/events/${eventId}/media/${encodeURIComponent(filename)}`)
      .then(() => undefined);
  },

  // --- Interactions ---------------------------------------------------------
  swipe(eventId: string, direction: EventSwipeDirection): Promise<void> {
    return api.post(`/events/${eventId}/swipe`, { direction }).then(() => undefined);
  },

  getChat(eventId: string): Promise<EventChatGroup> {
    return api.get<EventChatGroup>(`/events/${eventId}/chat`).then((r) => r.data);
  },

  report(eventId: string, payload: ReportEventPayload): Promise<void> {
    return api.post(`/events/${eventId}/report`, payload).then(() => undefined);
  },

  // Billet PDF binaire (Content-Type application/pdf) → Blob.
  getTicket(eventId: string): Promise<Blob> {
    return api
      .get(`/events/${eventId}/ticket`, { responseType: 'blob' })
      .then((r) => r.data as Blob);
  },
};
