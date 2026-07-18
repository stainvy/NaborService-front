// Miroir de `NotificationType` côté back
// (services/api/src/modules/messaging/entities/notification.entity.ts).
export type NotificationType =
  | 'new_message'
  | 'new_event'
  | 'new_listing_interest'
  | 'listing_accepted'
  | 'contract_pending'
  | 'contract_signed'
  | 'contract_fully_signed'
  | 'payment_confirmed'
  | 'waitlist_place'
  | 'new_follower'
  | 'new_poll'
  | 'incident_resolved'
  | 'event_cancelled'
  | 'missed_call'
  | 'call_summary';

export interface AppNotification {
  id: string;
  type: NotificationType;
  payload: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsPage {
  notifications: AppNotification[];
  unreadCount: number;
}
