import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useChatGroups } from '@/features/chat/hooks/useChatGroups';
import { useUnreadCount } from '../hooks/useNotifications';
import { useNotificationsSocket } from '../hooks/useNotificationsSocket';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const { t } = useTranslation('notifications');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useNotificationsSocket();

  const { data: groups } = useChatGroups();
  const { data: unreadNotifications } = useUnreadCount();

  const unreadMessages = (groups ?? []).reduce((sum, g) => sum + (g.unread_count ?? 0), 0);
  const totalUnread = unreadMessages + (unreadNotifications?.unreadCount ?? 0);

  useClickOutside(containerRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('title')}
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-fg hover:bg-gray/10"
      >
        <Bell className="h-5 w-5" />
        {totalUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-bold text-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
      {open && <NotificationPanel onNavigate={() => setOpen(false)} />}
    </div>
  );
}
