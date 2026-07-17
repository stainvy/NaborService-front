import { api } from '@/lib/api';
import type {
  AdminMessage,
  AdminMessagesPage,
  AdminGroup,
  AdminUser,
  AdminUsersQuery,
  AdminLedgerQuery,
  AdminConfig,
  RgpdRequest,
  RgpdRequestStatusResponse,
  StatsOverview,
  StatsListings,
  StatsEvents,
  StatsPayments,
  StatsUsers,
  StatsIncidents,
} from '@/types/admin';
import type { Paginated } from '@/types/pagination';
import type { Role } from '@/types/roles';
import type { GroupSharedFile } from '@/types/chat';
import type { PointsLedgerEntry } from '@/services/points.service';

export type { AdminMessage, AdminGroup };

export const adminService = {
  // --- Chat (modération messages) ---

  /** Liste tous les groupes (admin). */
  listGroups(): Promise<AdminGroup[]> {
    return api.get<AdminGroup[]>('/admin/chat/groups').then((r) => r.data);
  },

  /** Historique paginé (cursor) des messages d'un groupe (admin, contourne l'appartenance). */
  getGroupMessages(groupId: string, params?: { cursor?: string; limit?: number }): Promise<AdminMessagesPage> {
    return api
      .get<AdminMessagesPage>(`/admin/chat/groups/${groupId}/messages`, { params })
      .then((r) => r.data);
  },

  /** Messages épinglés d'un groupe (admin, contourne l'appartenance). */
  getGroupPinned(groupId: string): Promise<{ messages: AdminMessage[] }> {
    return api.get<{ messages: AdminMessage[] }>(`/admin/chat/groups/${groupId}/pinned`).then((r) => r.data);
  },

  /** Fichiers partagés d'un groupe (admin, contourne l'appartenance). */
  getGroupAttachments(groupId: string): Promise<{ attachments: GroupSharedFile[] }> {
    return api.get<{ attachments: GroupSharedFile[] }>(`/admin/chat/groups/${groupId}/attachments`).then((r) => r.data);
  },

  /** Lit un message déchiffré (contourne l'appartenance au groupe). */
  getMessage(messageId: string): Promise<AdminMessage> {
    return api.get<AdminMessage>(`/admin/chat/messages/${messageId}`).then((r) => r.data);
  },

  /** Réécrit le contenu d'un message (les deux côtés d'une conversation, tout message d'un groupe). */
  editMessage(messageId: string, content: string): Promise<AdminMessage> {
    return api.patch<AdminMessage>(`/admin/chat/messages/${messageId}`, { content }).then((r) => r.data);
  },

  /** Épingle un message (contourne le rôle de groupe). */
  pinMessage(messageId: string): Promise<AdminMessage> {
    return api.post<AdminMessage>(`/admin/chat/messages/${messageId}/pin`).then((r) => r.data);
  },

  /** Désépingle un message. */
  unpinMessage(messageId: string): Promise<AdminMessage> {
    return api.delete<AdminMessage>(`/admin/chat/messages/${messageId}/pin`).then((r) => r.data);
  },

  /** Supprime un message (soft delete). */
  deleteMessage(messageId: string): Promise<void> {
    return api.delete(`/admin/chat/messages/${messageId}`).then(() => undefined);
  },

  // --- Users ---
  // GET /admin/users -> Paginated<AdminUser> { data, meta: { total, offset, limit } }
  // (confirmé /api-json).

  listUsers(params?: AdminUsersQuery): Promise<Paginated<AdminUser>> {
    return api.get<Paginated<AdminUser>>('/admin/users', { params }).then((r) => r.data);
  },

  getUser(id: string): Promise<AdminUser> {
    return api.get<AdminUser>(`/admin/users/${id}`).then((r) => r.data);
  },

  deleteUser(id: string): Promise<void> {
    return api.delete(`/admin/users/${id}`).then(() => undefined);
  },

  updateUserRole(id: string, role: Role): Promise<AdminUser> {
    return api.patch<AdminUser>(`/admin/users/${id}/role`, { role }).then((r) => r.data);
  },

  suspendUser(id: string): Promise<AdminUser> {
    return api.post<AdminUser>(`/admin/users/${id}/suspend`).then((r) => r.data);
  },

  restoreUser(id: string): Promise<AdminUser> {
    return api.post<AdminUser>(`/admin/users/${id}/restore`).then((r) => r.data);
  },

  resetUserTotp(id: string): Promise<void> {
    return api.delete(`/admin/users/${id}/totp`).then(() => undefined);
  },

  // --- Points (grand livre, tous utilisateurs) ---

  getPointsLedger(params?: AdminLedgerQuery): Promise<Paginated<PointsLedgerEntry>> {
    return api.get<Paginated<PointsLedgerEntry>>('/admin/points/ledger', { params }).then((r) => r.data);
  },

  // --- Config ---

  getConfig(): Promise<AdminConfig> {
    return api.get<AdminConfig>('/admin/config').then((r) => r.data);
  },

  updateConfig(payload: Partial<AdminConfig>): Promise<AdminConfig> {
    return api.patch<AdminConfig>('/admin/config', payload).then((r) => r.data);
  },

  // --- Stats ---

  getStatsOverview(): Promise<StatsOverview> {
    return api.get<StatsOverview>('/admin/stats/overview').then((r) => r.data);
  },

  getStatsListings(): Promise<StatsListings> {
    return api.get<StatsListings>('/admin/stats/listings').then((r) => r.data);
  },

  getStatsEvents(): Promise<StatsEvents> {
    return api.get<StatsEvents>('/admin/stats/events').then((r) => r.data);
  },

  getStatsPayments(): Promise<StatsPayments> {
    return api.get<StatsPayments>('/admin/stats/payments').then((r) => r.data);
  },

  getStatsUsers(): Promise<StatsUsers> {
    return api.get<StatsUsers>('/admin/stats/users').then((r) => r.data);
  },

  getStatsIncidents(): Promise<StatsIncidents> {
    return api.get<StatsIncidents>('/admin/stats/incidents').then((r) => r.data);
  },

  // --- RGPD ---
  // GET /admin/rgpd/requests -> RgpdRequestDto[] brut, sans pagination (confirmé /api-json).

  listRgpdRequests(): Promise<RgpdRequest[]> {
    return api.get<RgpdRequest[]>('/admin/rgpd/requests').then((r) => r.data);
  },

  anonymizeRgpdRequest(userId: string): Promise<void> {
    return api.post(`/admin/rgpd/requests/${userId}/anonymize`).then(() => undefined);
  },

  getRgpdRequestStatus(userId: string): Promise<RgpdRequestStatusResponse> {
    return api.get<RgpdRequestStatusResponse>(`/admin/rgpd/requests/${userId}/status`).then((r) => r.data);
  },
};
