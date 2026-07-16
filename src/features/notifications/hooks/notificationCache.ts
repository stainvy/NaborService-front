import type { QueryClient } from '@tanstack/react-query';
import type { AppNotification, NotificationsPage } from '@/types/notification';
import { notificationKeys } from './queryKeys';

/** Préfixe une notification reçue en direct (événement `notification:new`). */
export function prependNotification(queryClient: QueryClient, notification: AppNotification): void {
  queryClient.setQueryData<NotificationsPage>(notificationKeys.list, (old) => {
    if (!old) return { notifications: [notification], unreadCount: notification.read ? 0 : 1 };
    if (old.notifications.some((n) => n.id === notification.id)) return old;
    return {
      notifications: [notification, ...old.notifications],
      unreadCount: notification.read ? old.unreadCount : old.unreadCount + 1,
    };
  });
  if (!notification.read) {
    queryClient.setQueryData<{ unreadCount: number }>(notificationKeys.unreadCount, (old) => ({
      unreadCount: (old?.unreadCount ?? 0) + 1,
    }));
  }
}

/** Marque une notification (ou toutes) comme lue directement dans le cache — utilisé par
 * l'optimistic update des mutations et par l'écho socket `notification:read_ack`. */
export function markNotificationsReadInCache(
  queryClient: QueryClient,
  target: { notificationId: string } | { all: true },
): void {
  queryClient.setQueryData<NotificationsPage>(notificationKeys.list, (old) => {
    if (!old) return old;
    let changed = 0;
    const notifications = old.notifications.map((n) => {
      if (n.read) return n;
      if ('all' in target || n.id === target.notificationId) {
        changed += 1;
        return { ...n, read: true };
      }
      return n;
    });
    if (changed === 0) return old;
    return { notifications, unreadCount: Math.max(0, old.unreadCount - changed) };
  });

  queryClient.setQueryData<{ unreadCount: number }>(notificationKeys.unreadCount, (old) => {
    if (!old) return old;
    if ('all' in target) return { unreadCount: 0 };
    return { unreadCount: Math.max(0, old.unreadCount - 1) };
  });
}
