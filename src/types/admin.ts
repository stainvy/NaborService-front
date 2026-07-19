import type { Role } from './roles';
import type { PageParams } from './pagination';
import type { NaborEvent } from '@/services/events.service';
import type { PointsLedgerEntryType } from '@/services/points.service';

// --- Chat (déplacé depuis admin.service.ts) ---

export interface AdminMessageSender {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture_mongo_id: string | null;
}

export interface AdminMessageAttachment {
  media_id: string;
  filename: string;
  mimetype: string;
  size_bytes: number;
}

export interface AdminMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender?: AdminMessageSender | null;
  type: 'text' | 'image' | 'file' | 'voice' | 'poll';
  content?: string; // déchiffré par le serveur avec la clé admin
  sent_at: string;
  edited_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by_moderator_id?: string | null;
  parent_message_id?: string | null;
  attachments?: AdminMessageAttachment[];
  reactions?: { pg_user_id: string; emoji: string }[];
  /** Renseigné quand type === 'poll' — sondage attaché au message. */
  poll_id?: string | null;
  pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
}

/** Page renvoyée par GET /admin/chat/groups/:id/messages (pagination cursor-based). */
export interface AdminMessagesPage {
  messages: AdminMessage[];
  has_more?: boolean;
  cursor?: string;
}

export interface AdminGroup {
  id: string;
  name: string | null;
  type: string;
  createdBy: string | null;
  createdAt: string;
  memberCount: number;
  /** Membres actifs (utile pour identifier qui parle à qui dans un message privé, sans nom de groupe). */
  participants: { id: string; first_name: string; last_name: string }[];
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
  pointsBalance: number;
  payoutsEnabled: boolean;
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

// --- Points (grand livre, tous utilisateurs) ---

export interface AdminLedgerQuery extends PageParams {
  userId?: string;
  type?: PointsLedgerEntryType;
}

export interface AdminAdjustPointsPayload {
  userId: string;
  amountPoints: number;
  description?: string;
}

export interface AdminAdjustPointsResult {
  success: boolean;
  userId: string;
  amountPoints: number;
  balanceAfterPoints: number;
  entryId: string;
}

// --- Moderation ---
// Item shapes confirmées via /api-json (ReportedListingItemDto/ReportedEventItemDto) —
// asymétriques entre listings et events. Les deux endpoints renvoient désormais
// l'enveloppe Paginated<T> générique (voir src/types/pagination.ts).

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

// GET /events/reported item — enveloppe l'entité événement complète (non typée côté API).
export interface ReportedEventItem {
  event: NaborEvent;
  reportCount: number;
  lastReportedAt: string;
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
