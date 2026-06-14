import { api } from '@/lib/api';
import type { User } from '@/types/user';
import type {
  ChangeEmailPayload,
  ChangePasswordPayload,
  DeleteAccountPayload,
  LocaleResponse,
  NotificationPreferences,
  ProcessingType,
  RectifyDataPayload,
  UpdateNotifPrefsPayload,
  UpdateProfilePayload,
} from '@/features/profile/types';

// Service du domaine « users » (profil de l'utilisateur connecté, médias,
// sécurité, préférences, RGPD). Seul endroit qui connaît ces URLs.
export const usersService = {
  // --- Profil ---------------------------------------------------------------
  getMe(): Promise<User> {
    return api.get<User>('/users/me').then((r) => r.data);
  },

  updateProfile(payload: UpdateProfilePayload): Promise<User> {
    return api.patch<User>('/users/me', payload).then((r) => r.data);
  },

  // Soft delete — TOTP obligatoire, réponse 204.
  deleteAccount(payload: DeleteAccountPayload): Promise<void> {
    return api.delete('/users/me', { data: payload }).then(() => undefined);
  },

  // --- Médias (multipart, champ « file ») -----------------------------------
  uploadAvatar(file: File): Promise<{ profilePictureMongoId: string }> {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<{ profilePictureMongoId: string }>('/users/me/avatar', form)
      .then((r) => r.data);
  },

  deleteAvatar(): Promise<void> {
    return api.delete('/users/me/avatar').then(() => undefined);
  },

  uploadBanner(file: File): Promise<{ bannerMongoId: string }> {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ bannerMongoId: string }>('/users/me/banner', form).then((r) => r.data);
  },

  deleteBanner(): Promise<void> {
    return api.delete('/users/me/banner').then(() => undefined);
  },

  // --- Sécurité (204) -------------------------------------------------------
  changePassword(payload: ChangePasswordPayload): Promise<void> {
    return api.patch('/users/me/password', payload).then(() => undefined);
  },

  changeEmail(payload: ChangeEmailPayload): Promise<void> {
    return api.patch('/users/me/email', payload).then(() => undefined);
  },

  // --- Préférences ----------------------------------------------------------
  getLocale(): Promise<LocaleResponse> {
    return api.get<LocaleResponse>('/users/me/locale').then((r) => r.data);
  },

  updateLocale(locale: string): Promise<LocaleResponse> {
    return api.patch<LocaleResponse>('/users/me/locale', { locale }).then((r) => r.data);
  },

  getNotifPrefs(): Promise<NotificationPreferences> {
    return api
      .get<NotificationPreferences>('/users/me/notifications/preferences')
      .then((r) => r.data);
  },

  updateNotifPrefs(payload: UpdateNotifPrefsPayload): Promise<NotificationPreferences> {
    return api
      .patch<NotificationPreferences>('/users/me/notifications/preferences', payload)
      .then((r) => r.data);
  },

  // --- RGPD -----------------------------------------------------------------
  exportData(format: 'json' | 'csv'): Promise<Blob> {
    const url = format === 'csv' ? '/users/me/export/csv' : '/users/me/export';
    return api.get(url, { responseType: 'blob' }).then((r) => r.data as Blob);
  },

  rectifyData(payload: RectifyDataPayload): Promise<void> {
    return api.patch('/users/me/personal-data', payload).then(() => undefined);
  },

  // ⚠️ forme exacte des items non exposée par Swagger (vide au sondage).
  getOptOuts(): Promise<{ optOuts: ProcessingType[] }> {
    return api
      .get<{ optOuts: ProcessingType[] }>('/users/me/data-processing/opt-out')
      .then((r) => r.data);
  },

  optOut(processingType: ProcessingType): Promise<void> {
    return api.post('/users/me/data-processing/opt-out', { processingType }).then(() => undefined);
  },

  cancelOptOut(processingType: ProcessingType): Promise<void> {
    return api
      .delete('/users/me/data-processing/opt-out', { data: { processingType } })
      .then(() => undefined);
  },

  restrictProcessing(): Promise<void> {
    return api.post('/users/me/data-processing/restrict').then(() => undefined);
  },

  cancelRestrictProcessing(): Promise<void> {
    return api.delete('/users/me/data-processing/restrict').then(() => undefined);
  },
};
