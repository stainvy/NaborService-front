// Types du module Profil. camelCase partout (corps ET réponses), conforme au back.

export type Visibility = 'public' | 'friends' | 'private';
export type MessagePolicy = 'open' | 'filtered' | 'closed';

export const VISIBILITIES: Visibility[] = ['public', 'friends', 'private'];
export const MESSAGE_POLICIES: MessagePolicy[] = ['open', 'filtered', 'closed'];

// PATCH /users/me — tous les champs optionnels. totpCode requis si champ
// sensible (email) modifié.
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  bio?: string;
  visibility?: Visibility;
  messagePolicy?: MessagePolicy;
  neighbourhoodId?: string;
  email?: string;
  totpCode?: string;
}

// PATCH /users/me/password — 204
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  totpCode: string;
}

// PATCH /users/me/email — 204
export interface ChangeEmailPayload {
  newEmail: string;
  totpCode: string;
}

// GET/PATCH /users/me/notifications/preferences
export interface NotificationPreferences {
  userId: string;
  notifNewFollower: boolean;
  notifNewListing: boolean;
  notifNewEvent: boolean;
  notifNewPoll: boolean;
  notifWaitlist: boolean;
  notifMessage: boolean;
  updatedAt: string | null;
}

// Clés modifiables (sans userId/updatedAt).
export type NotifPrefKey = Exclude<keyof NotificationPreferences, 'userId' | 'updatedAt'>;
export const NOTIF_PREF_KEYS: NotifPrefKey[] = [
  'notifNewFollower',
  'notifNewListing',
  'notifNewEvent',
  'notifNewPoll',
  'notifWaitlist',
  'notifMessage',
];

export type UpdateNotifPrefsPayload = Partial<Record<NotifPrefKey, boolean>>;

export interface LocaleResponse {
  locale: string;
}

// RGPD
export type ProcessingType = 'discovery' | 'notifications' | 'neo4j_tracking';
export const PROCESSING_TYPES: ProcessingType[] = ['discovery', 'notifications', 'neo4j_tracking'];

export interface RectifyDataPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  totpCode: string;
}

export interface DeleteAccountPayload {
  totpCode: string;
}
