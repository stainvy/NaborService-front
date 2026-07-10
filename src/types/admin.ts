import type { Role } from './roles';
import type { PageParams } from './pagination';
import type { NaborEvent } from '@/services/events.service';

// --- Chat (déplacé depuis admin.service.ts) ---

export interface AdminMessage {
  id: string;
  pg_message_id: string;
  pg_group_id: string;
  pg_sender_id: string;
  type: 'text' | 'image' | 'file' | 'voice';
  content?: string; // déchiffré par le serveur avec la clé admin
  sent_at: string;
  edited_at?: string;
  deleted_at?: string;
  attachments?: { filename: string; mimetype: string; size_bytes: number }[];
  reactions?: { pg_user_id: string; emoji: string }[];
}

export interface AdminGroup {
  id: string;
  name: string;
  type: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
}

// --- Users ---
// Shape confirmée via /api-json (AdminUserDto / AdminUsersListDto). Pas de champ
// `status` littéral côté API : dérivé de `deletedAt`/`isSuspended` côté UI.

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  visibility: 'public' | 'friends' | 'private';
  messagePolicy: 'open' | 'filtered' | 'closed';
  bio: string | null;
  locale: string;
  neighbourhoodId: string | null;
  stripeAccountId: string | null;
  profilePictureMongoId: string | null;
  bannerMongoId: string | null;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  isSuspended: boolean;
  suspendedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export type AdminUserStatus = 'active' | 'suspended' | 'deleted';

export function adminUserStatus(user: Pick<AdminUser, 'isSuspended' | 'deletedAt'>): AdminUserStatus {
  if (user.deletedAt) return 'deleted';
  if (user.isSuspended) return 'suspended';
  return 'active';
}

export interface AdminUsersQuery extends PageParams {
  role?: Role;
  q?: string;
}

// GET /admin/users -> { users, total } (pas l'enveloppe Paginated<T> générique)
export interface AdminUsersListResponse {
  users: AdminUser[];
  total: number;
}

// --- Moderation ---
// Shapes confirmées via /api-json (ReportedListingsResponseDto/ReportedListingItemDto,
// ReportedEventsResponseDto/ReportedEventItemDto) — asymétriques entre listings et events.

export type ModerationTargetType = 'listing' | 'event';
// Valeurs confirmées via /api-json (ModerateDto / ModerateListingDto) — passé, pas infinitif.
export type ModerationActionType = 'cancelled' | 'warned' | 'restored';

export interface ModerationAction {
  id: string;
  targetType: ModerationTargetType;
  targetId: string;
  action: ModerationActionType;
  reason?: string;
  moderatorId: string;
  createdAt: string;
}

// GET /listings/reported item — plat, snake_case (distinct du type `Listing` camelCase).
export interface ReportedListingItem {
  id: string;
  title: string;
  listing_type: 'offer' | 'request';
  price_cents: number;
  status: 'open' | 'pending' | 'in_progress' | 'closed' | 'cancelled';
  neighbourhood_id: string | null;
  category_id: string;
  creator_id: string;
  created_at: string;
  reports_count: number;
  last_reason: string | null;
  last_report_at: string | null;
}

export interface ReportedListingsResponse {
  data: ReportedListingItem[];
  total: number;
}

// GET /events/reported item — enveloppe l'entité événement complète (non typée côté API).
export interface ReportedEventItem {
  event: NaborEvent;
  reportCount: number;
  lastReportedAt: string;
}

export interface ReportedEventsResponse {
  items: ReportedEventItem[];
  total: number;
}

// --- Config ---
// Shape confirmée via /api-json (UpdateConfigDto) — tous les champs sont optionnels côté API.
// La réponse GET/PATCH n'est pas documentée côté Swagger (juste une description) —
// on suppose la même forme que le DTO de mise à jour.

export interface AdminConfig {
  commissionPercent?: number;
  refundDeadlineHours?: number;
  contractExpirationHours?: number;
  waitlistConfirmHours?: number;
}

// --- RGPD ---
// Shape confirmée via /api-json (RgpdRequestDto / RgpdRequestStatusDto).
// GET /admin/rgpd/requests renvoie un tableau brut, sans pagination ni enveloppe.

export type RgpdRequestStatus = 'pending' | 'completed';

export interface RgpdRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  deletedAt: string;
  status: RgpdRequestStatus;
}

export type RgpdRequestDetailStatus = 'none' | 'pending' | 'completed';

export interface RgpdRequestStatusResponse {
  status: RgpdRequestDetailStatus;
}

// --- Stats ---
// Shapes confirmées via /api-json (AdminOverviewStatsDto, AdminListingsStatsDto,
// AdminEventsStatsDto, AdminPaymentsStatsDto, AdminUsersStatsDto, AdminIncidentsStatsDto,
// et les *BreakdownItemDto associés).

export interface StatsOverview {
  totalUsers: number;
  totalListings: number;
  totalEvents: number;
  activeIncidents: number;
  totalPaymentsCents: number;
}

export interface StatsListings {
  typeBreakdown: { type: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  categoryBreakdown: { categoryName: string; count: number }[];
}

export interface StatsEvents {
  statusBreakdown: { status: string; count: number }[];
  categoryBreakdown: { categoryName: string; count: number }[];
  participantBreakdown: { status: string; count: number }[];
}

export interface StatsPayments {
  totalAmountCents: number;
  totalCommissionCents: number;
  statusBreakdown: { status: string; count: number }[];
}

export interface StatsUsers {
  roleBreakdown: { role: string; count: number }[];
  suspendedCount: number;
  neighbourhoodBreakdown: { neighbourhoodId: string; count: number }[];
}

export interface StatsIncidents {
  statusBreakdown: { status: string; count: number }[];
  severityBreakdown: { severity: string; count: number }[];
}
