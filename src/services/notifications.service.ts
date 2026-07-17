import { api } from '@/lib/api';
import type { NotificationsPage } from '@/types/notification';

export const notificationsService = {
  /** Notifications de l'utilisateur connecté, plus récentes en premier. */
  list(offset = 0, limit = 50): Promise<NotificationsPage> {
    return api
      .get<NotificationsPage>('/notifications', { params: { offset, limit } })
      .then((r) => r.data);
  },

  getUnreadCount(): Promise<{ unreadCount: number }> {
    return api.get<{ unreadCount: number }>('/notifications/unread-count').then((r) => r.data);
  },

  markRead(notificationId: string): Promise<void> {
    return api.patch(`/notifications/${notificationId}/read`).then(() => undefined);
  },

  markAllRead(): Promise<void> {
    return api.patch('/notifications/read-all').then(() => undefined);
  },
};
