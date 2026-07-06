import { api } from '@/lib/api';

// --- Types ---

export interface NaborEvent {
  id: string;
  creatorId?: string;
  title: string;
  description?: string;
  categoryId?: number;
  groupId?: string;
  status: 'draft' | 'published' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  inviteCode?: string | null;
  costCents: number;
  maxParticipants?: number;
  startsAt?: string;
  endsAt?: string;
  neighbourhoodId?: string;
  refundDeadlineHours?: number;
  mongoDocumentId?: string | null;
  publishedAt?: string;
  cancelledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  [key: string]: unknown;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  category_id?: number;
  invite_code?: string;
  cost_cents?: number;
  max_participants?: number;
  starts_at?: string;
  ends_at?: string;
  neighbourhood_id?: string;
  refund_deadline_hours?: number;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {}

// --- Service ---

export const eventsService = {
  /** Feed événements. */
  list(params?: Record<string, string>): Promise<NaborEvent[]> {
    return api.get<NaborEvent[]>('/events', { params }).then((r) => r.data);
  },

  /** Créer un événement (brouillon). */
  create(payload: CreateEventPayload): Promise<NaborEvent> {
    return api.post<NaborEvent>('/events', payload).then((r) => r.data);
  },

  /** Détail d'un événement. */
  getById(eventId: string): Promise<NaborEvent> {
    return api.get<NaborEvent>(`/events/${eventId}`).then((r) => r.data);
  },

  /** Modifier un événement. */
  update(eventId: string, payload: UpdateEventPayload): Promise<NaborEvent> {
    return api.patch<NaborEvent>(`/events/${eventId}`, payload).then((r) => r.data);
  },

  /** Soft delete. */
  delete(eventId: string): Promise<void> {
    return api.delete(`/events/${eventId}`).then(() => undefined);
  },

  /** Contenu enrichi HTML. */
  getContent(eventId: string): Promise<unknown> {
    return api.get(`/events/${eventId}/content`).then((r) => r.data);
  },

  /** Modifier contenu enrichi. */
  updateContent(eventId: string, payload: { body_html?: string }): Promise<unknown> {
    return api.patch(`/events/${eventId}/content`, payload).then((r) => r.data);
  },

  // --- Lifecycle ---

  publish(eventId: string): Promise<NaborEvent> {
    return api.post<NaborEvent>(`/events/${eventId}/publish`).then((r) => r.data);
  },

  open(eventId: string): Promise<NaborEvent> {
    return api.post<NaborEvent>(`/events/${eventId}/open`).then((r) => r.data);
  },

  complete(eventId: string): Promise<NaborEvent> {
    return api.post<NaborEvent>(`/events/${eventId}/complete`).then((r) => r.data);
  },

  cancel(eventId: string, reason?: string): Promise<NaborEvent> {
    return api.post<NaborEvent>(`/events/${eventId}/cancel`, { reason }).then((r) => r.data);
  },

  // --- Participants ---

  getParticipants(eventId: string): Promise<unknown[]> {
    return api.get(`/events/${eventId}/participants`).then((r) => r.data);
  },

  register(eventId: string): Promise<void> {
    return api.post(`/events/${eventId}/register`).then(() => undefined);
  },

  unregister(eventId: string): Promise<void> {
    return api.delete(`/events/${eventId}/participants/me`).then(() => undefined);
  },

  // --- Media ---

  /** Upload cover/attachment (multipart, champ « file »). */
  uploadMedia(eventId: string, file: File): Promise<{ type: 'cover' | 'attachment'; name?: string; mimetype: string; size_bytes: number }> {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/events/${eventId}/media`, form).then((r) => r.data);
  },

  /** Supprimer un média par son nom de fichier. */
  deleteMedia(eventId: string, filename: string): Promise<void> {
    return api.delete(`/events/${eventId}/media/${encodeURIComponent(filename)}`).then(() => undefined);
  },
};
