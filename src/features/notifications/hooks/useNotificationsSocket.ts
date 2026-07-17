import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getNotificationsSocket } from '@/lib/socket';
import type { AppNotification, NotificationType } from '@/types/notification';
import {
  markNotificationsReadInCache,
  prependNotification,
  removeNotificationsFromCache,
} from './notificationCache';

// Charge utile socket brute — `created_at` en snake_case côté serveur
// (NotificationsService.create), contrairement au REST qui renvoie `createdAt`.
interface NotificationNewPayload {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

type NotificationReadAckPayload = { notification_id: string } | { all: true };
type NotificationDeletedPayload = { notification_id: string } | { all: true };

function normalize(payload: NotificationNewPayload): AppNotification {
  return {
    id: payload.id,
    type: payload.type,
    payload: payload.payload,
    read: payload.read,
    createdAt: payload.created_at,
  };
}

/**
 * Écoute le namespace /notifications (voir services/api .../messaging/notifications.gateway.ts) :
 * une nouvelle notification arrive en direct, ou un accusé de lecture émis
 * depuis un autre onglet/appareil doit être répercuté ici. À appeler une fois
 * (ex. depuis NotificationBell) — les listeners restent attachés tant que le
 * composant appelant est monté.
 */
export function useNotificationsSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getNotificationsSocket();
    if (!socket) return;

    function onNew(payload: NotificationNewPayload) {
      prependNotification(queryClient, normalize(payload));
    }

    function onReadAck(payload: NotificationReadAckPayload) {
      if ('all' in payload) {
        markNotificationsReadInCache(queryClient, { all: true });
      } else {
        markNotificationsReadInCache(queryClient, { notificationId: payload.notification_id });
      }
    }

    function onDeleted(payload: NotificationDeletedPayload) {
      if ('all' in payload) {
        removeNotificationsFromCache(queryClient, { all: true });
      } else {
        removeNotificationsFromCache(queryClient, { notificationId: payload.notification_id });
      }
    }

    socket.on('notification:new', onNew);
    socket.on('notification:read_ack', onReadAck);
    socket.on('notification:deleted', onDeleted);

    return () => {
      socket.off('notification:new', onNew);
      socket.off('notification:read_ack', onReadAck);
      socket.off('notification:deleted', onDeleted);
    };
  }, [queryClient]);
}
