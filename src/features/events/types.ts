import type { Paginated } from '@/types/pagination';

// ⚠️ Convention API (vérifiée sur ~/NaborService-api) : corps de REQUÊTE en
// snake_case (starts_at, cost_cents, category_id…), RÉPONSES en camelCase.

export type EventStatus =
  | 'draft'
  | 'published'
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// Statuts filtrables sur le feed (cf. ListEventsDto côté back).
export const EVENT_FILTER_STATUSES: EventStatus[] = [
  'draft',
  'published',
  'open',
  'completed',
  'cancelled',
];

// Réponse GET /events/:id (camelCase).
export interface NaborEvent {
  id: string;
  creatorId?: string;
  title: string;
  description?: string | null;
  categoryId?: number | null;
  groupId?: string | null;
  status: EventStatus;
  inviteCode?: string | null;
  costCents: number;
  maxParticipants?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  neighbourhoodId?: string | null;
  refundDeadlineHours?: number;
  mongoDocumentId?: string | null;
  publishedAt?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  [key: string]: unknown;
}

// GET /events → { data, meta } (cf. ListEventsResponseDto).
export type EventsPage = Paginated<NaborEvent>;

export interface EventFilters {
  offset?: number;
  limit?: number;
  neighbourhood?: string;
  category?: number;
  status?: EventStatus;
}

// --- Corps de requête (snake_case, NE PAS normaliser) ---------------------
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

export type UpdateEventPayload = Partial<CreateEventPayload>;

// PATCH /events/:id/content (body_html assaini par DOMPurify avant rendu).
export interface EventContent {
  body_html?: string;
  programme?: { time: string; label: string }[];
  location?: { address?: string; geocode?: string };
  [key: string]: unknown;
}

export interface UpdateEventContentPayload {
  body_html?: string;
  programme?: { time: string; label: string }[];
  location?: { address?: string; geocode?: string };
}

// Participant / liste d'attente (relation `user` chargée côté back).
// ⚠️ getParticipants / getWaitlist sont réservés au créateur (403 sinon).
export interface EventParticipant {
  eventId?: string;
  userId?: string;
  status?: 'registered' | 'waitlisted' | string;
  registeredAt?: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profilePictureMongoId?: string | null;
  };
  [key: string]: unknown;
}

export interface EventChatGroup {
  id?: string;
  [key: string]: unknown;
}

export type EventSwipeDirection = 'like' | 'dislike';

export interface ReportEventPayload {
  reason: string;
}
