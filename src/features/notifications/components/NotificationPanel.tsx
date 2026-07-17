import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCheck, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { useChatGroups } from '@/features/chat/hooks/useChatGroups';
import { getGroupAvatarProps, getGroupDisplayName } from '@/features/chat/utils';
import {
  useDeleteAllNotifications,
  useMarkAllNotificationsRead,
  useNotifications,
} from '../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

interface NotificationPanelProps {
  onNavigate: () => void;
}

const MAX_UNREAD_CONVERSATIONS = 5;

export function NotificationPanel({ onNavigate }: NotificationPanelProps) {
  const { t } = useTranslation('notifications');
  const { t: tChat } = useTranslation('messages');
  const { data: groups, isLoading: groupsLoading } = useChatGroups();
  const { data: notificationsPage, isLoading: notificationsLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteAll = useDeleteAllNotifications();

  const unreadConversations = (groups ?? [])
    .filter((g) => !!g.unread_count)
    .slice(0, MAX_UNREAD_CONVERSATIONS);
  const notifications = notificationsPage?.notifications ?? [];
  const hasUnread = (notificationsPage?.unreadCount ?? 0) > 0;
  const isLoading = groupsLoading || notificationsLoading;
  const isEmpty = !isLoading && unreadConversations.length === 0 && notifications.length === 0;

  return (
    <div
      role="menu"
      aria-label={t('title')}
      className="absolute right-0 top-full z-20 mt-2 w-80 rounded-md border border-gray/20 bg-white shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-gray/10 px-4 py-3">
        <h2 className="text-sm font-bold text-navy">{t('title')}</h2>
        <div className="flex items-center gap-3">
          {hasUnread && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 text-xs font-medium text-orange hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t('mark_all_read')}
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t('confirm_delete_all'))) deleteAll.mutate();
              }}
              className="flex items-center gap-1 text-xs font-medium text-gray hover:text-error hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('delete_all')}
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto p-2">
        {isLoading && <p className="p-4 text-center text-sm text-gray">…</p>}
        {isEmpty && <p className="p-4 text-center text-sm text-gray">{t('empty')}</p>}

        {unreadConversations.length > 0 && (
          <div className="mb-2">
            <p className="px-2.5 pb-1 text-xs font-semibold uppercase text-gray">
              {t('messages_section')}
            </p>
            <div className="flex flex-col gap-1">
              {unreadConversations.map((group) => (
                <Link
                  key={group.id}
                  to={`/chat/${group.id}`}
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray/5"
                >
                  <Avatar {...getGroupAvatarProps(group)} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-navy">
                      {getGroupDisplayName(group, tChat)}
                    </span>
                  </span>
                  <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange px-1.5 text-[11px] font-bold text-white">
                    {group.unread_count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="flex flex-col gap-1">
            {unreadConversations.length > 0 && (
              <p className="px-2.5 pb-1 text-xs font-semibold uppercase text-gray">
                {t('notifications_section')}
              </p>
            )}
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
