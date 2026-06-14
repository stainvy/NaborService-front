export const profileKeys = {
  me: ['users', 'me'] as const,
  notifPrefs: ['users', 'me', 'notif-prefs'] as const,
  locale: ['users', 'me', 'locale'] as const,
  optOuts: ['users', 'me', 'opt-outs'] as const,
};
