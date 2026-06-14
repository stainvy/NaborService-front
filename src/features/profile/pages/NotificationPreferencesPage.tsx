import { useTranslation } from 'react-i18next';
import { Toggle } from '@/components/Toggle';
import { useNotifPrefs, useUpdateNotifPrefs } from '../hooks/useNotifPrefs';
import { NOTIF_PREF_KEYS } from '../types';

export function NotificationPreferencesPage() {
  const { t } = useTranslation('profile');
  const { data: prefs, isLoading } = useNotifPrefs();
  const update = useUpdateNotifPrefs();

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-white p-6">
      <h1 className="mb-6 text-xl font-bold text-navy">{t('notif.title')}</h1>

      {isLoading || !prefs ? (
        <p className="text-gray">…</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray/20">
          {NOTIF_PREF_KEYS.map((key) => (
            <Toggle
              key={key}
              label={t(`notif.${key}`)}
              checked={prefs[key]}
              disabled={update.isPending}
              // PATCH partiel : on n'envoie que la clé modifiée.
              onChange={(checked) => update.mutate({ [key]: checked })}
            />
          ))}
        </div>
      )}

      {update.isSuccess && <p className="mt-4 text-sm text-success">{t('notif.saved')}</p>}
    </div>
  );
}
