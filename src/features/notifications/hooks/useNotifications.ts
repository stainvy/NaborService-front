import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { notificationKeys } from './queryKeys';
import { markNotificationsReadInCache, removeNotificationsFromCache } from './notificationCache';

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => notificationsService.list(),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => notificationsService.getUnreadCount(),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.markRead(notificationId),
    onMutate: (notificationId: string) => {
      markNotificationsReadInCache(queryClient, { notificationId });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onMutate: () => {
      markNotificationsReadInCache(queryClient, { all: true });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationsService.delete(notificationId),
    onMutate: (notificationId: string) => {
      removeNotificationsFromCache(queryClient, { notificationId });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.deleteAll(),
    onMutate: () => {
      removeNotificationsFromCache(queryClient, { all: true });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}
