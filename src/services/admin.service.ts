import { api } from '@/lib/api';
import type {
  AdminMessage,
  AdminGroup,
  AdminUser,
  AdminUsersQuery,
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

export type { AdminMessage, AdminGroup };

export const adminService = {
  // --- Chat (modération messages) ---

  /** Liste tous les groupes (admin). */
  listGroups(): Promise<AdminGroup[]> {
    return api.get<AdminGroup[]>('/admin/chat/groups').then((r) => r.data);
  },

  /** Historique des messages d'un groupe (admin, contourne l'appartenance). */
  getGroupMessages(groupId: string, limit?: number): Promise<unknown[]> {
    return api
      .get(`/admin/chat/groups/${groupId}/messages`, { params: { limit } })
      .then((r) => r.data);
  },

  /** Lit un message déchiffré (contourne l'appartenance au groupe). */
  getMessage(messageId: string): Promise<AdminMessage> {
    return api.get<AdminMessage>(`/admin/chat/messages/${messageId}`).then((r) => r.data);
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
