import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { AppNotification } from '@/types/notification';
import { useMarkNotificationRead } from '../hooks/useNotifications';
import { getNotificationIcon, getNotificationLink, getNotificationMessage } from '../utils';

interface NotificationItemProps {
  notification: AppNotification;
  onNavigate?: () => void;
}

function formatRelativeTime(iso: string, t: ReturnType<typeof useTranslation>['t']): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return t('time_just_now');
  if (diffMin < 60) return t('time_minutes', { count: diffMin });
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return t('time_hours', { count: diffHours });
  const diffDays = Math.round(diffHours / 24);
  return t('time_days', { count: diffDays });
}

export function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
  const { t } = useTranslation('notifications');
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();
  const Icon = getNotificationIcon(notification.type);
  const link = getNotificationLink(notification);

  function handleClick() {
    if (!notification.read) markRead.mutate(notification.id);
    if (link) {
      navigate(link);
      onNavigate?.();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-gray/5 ${
        notification.read ? '' : 'bg-orange/5'
      }`}
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-navy">
          {getNotificationMessage(notification, t)}
        </span>
        <span className="block text-xs text-gray">
          {formatRelativeTime(notification.createdAt, t)}
        </span>
      </span>
      {!notification.read && (
        <span aria-hidden className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-orange" />
      )}
    </button>
  );
}
