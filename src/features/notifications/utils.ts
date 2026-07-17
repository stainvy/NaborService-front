import type { ComponentType } from 'react';
import type { TFunction } from 'i18next';
import {
  Bell,
  Calendar,
  CheckCircle,
  ClipboardList,
  CreditCard,
  FileText,
  MessageCircle,
  Phone,
  PhoneMissed,
  UserPlus,
} from 'lucide-react';
import type { AppNotification, NotificationType } from '@/types/notification';

type IconComponent = ComponentType<{ className?: string }>;

const NOTIFICATION_ICONS: Record<NotificationType, IconComponent> = {
  new_message: MessageCircle,
  new_event: Calendar,
  new_listing_interest: FileText,
  listing_accepted: CheckCircle,
  contract_pending: FileText,
  contract_signed: CheckCircle,
  payment_confirmed: CreditCard,
  waitlist_place: Calendar,
  new_follower: UserPlus,
  new_poll: ClipboardList,
  incident_resolved: CheckCircle,
  event_cancelled: Calendar,
  missed_call: PhoneMissed,
  call_summary: Phone,
};

export function getNotificationIcon(type: NotificationType): IconComponent {
  return NOTIFICATION_ICONS[type] ?? Bell;
}

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Construit le texte affiché pour une notification, à partir de son type + payload. */
export function getNotificationMessage(notification: AppNotification, t: TFunction): string {
  const p = notification.payload ?? {};

  switch (notification.type) {
    case 'missed_call':
      return t('types.missed_call', {
        name: (p.callerName as string) || t('someone'),
      });
    case 'call_summary':
      return t('types.call_summary', {
        name: (p.otherName as string) || t('someone'),
        duration: formatDuration(typeof p.durationSeconds === 'number' ? p.durationSeconds : 0),
      });
    case 'new_follower':
      return t('types.new_follower', {
        name: (p.firstName as string) || t('someone'),
      });
    case 'new_listing_interest':
      return t('types.new_listing_interest', { title: p.listingTitle as string });
    case 'listing_accepted':
      return t('types.listing_accepted', { title: p.listingTitle as string });
    case 'contract_pending':
      return t('types.contract_pending', { title: p.listingTitle as string });
    case 'contract_signed':
      return t('types.contract_signed');
    case 'payment_confirmed':
      return t('types.payment_confirmed');
    case 'event_cancelled':
      return t('types.event_cancelled', { title: p.eventTitle as string });
    case 'waitlist_place':
      return t('types.waitlist_place', { title: p.eventTitle as string });
    case 'incident_resolved':
      return t('types.incident_resolved', { title: p.title as string });
    case 'new_event':
      return t('types.new_event');
    case 'new_poll':
      return t('types.new_poll');
    case 'new_message':
      return t('types.new_message');
    default:
      return t('types.unknown');
  }
}

/** Cible de navigation au clic — `undefined` quand aucune page de détail n'existe encore côté front. */
export function getNotificationLink(notification: AppNotification): string | undefined {
  const p = notification.payload ?? {};

  switch (notification.type) {
    case 'missed_call':
    case 'call_summary':
      return typeof p.groupId === 'string' ? `/chat/${p.groupId}` : undefined;
    case 'new_follower':
      return typeof p.followerId === 'string' ? `/users/${p.followerId}` : undefined;
    case 'new_listing_interest':
    case 'listing_accepted':
    case 'contract_pending':
    case 'contract_signed':
      return typeof p.listingId === 'string' ? `/listings/${p.listingId}` : undefined;
    default:
      return undefined;
  }
}
