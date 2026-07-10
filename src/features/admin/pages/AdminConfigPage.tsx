import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { useAdminConfig, useUpdateAdminConfig } from '../hooks/useAdminConfig';
import type { AdminConfig } from '@/types/admin';

// Champs confirmés via /api-json (UpdateConfigDto) — tous optionnels côté API.
const FIELDS: { key: keyof AdminConfig; labelKey: string }[] = [
  { key: 'commissionPercent', labelKey: 'commission_percent' },
  { key: 'refundDeadlineHours', labelKey: 'refund_deadline_hours' },
  { key: 'contractExpirationHours', labelKey: 'contract_expiration_hours' },
  { key: 'waitlistConfirmHours', labelKey: 'waitlist_confirm_hours' },
];

export function AdminConfigPage() {
  const { t } = useTranslation('admin');
  const { data, isLoading, isError } = useAdminConfig();
  const updateConfig = useUpdateAdminConfig();
  const [form, setForm] = useState<AdminConfig>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  function updateField(key: keyof AdminConfig, raw: string) {
    setSaved(false);
    const value = raw === '' ? undefined : Number(raw);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    updateConfig.mutate(form, { onSuccess: () => setSaved(true) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('config.title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('config.subtitle')}</p>
      </div>

      {isLoading && <p className="text-sm text-admin-muted">{t('config.loading')}</p>}
      {isError && <p className="text-sm text-red-600">{t('config.error')}</p>}

      {!isLoading && !isError && (
        <div className="flex max-w-md flex-col gap-4 rounded-lg border border-admin-border bg-admin-surface p-5">
          {FIELDS.map(({ key, labelKey }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-admin-text">{t(`config.${labelKey}`)}</label>
              <input
                type="number"
                min={0}
                value={form[key] ?? ''}
                onChange={(e) => updateField(key, e.target.value)}
                className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent"
              />
            </div>
          ))}

          <div className="flex items-center gap-3 border-t border-admin-border pt-4">
            <Button tone="admin" onClick={handleSave} disabled={updateConfig.isPending}>
              {updateConfig.isPending ? '…' : t('config.save')}
            </Button>
            {saved && <span className="text-xs text-green-700">{t('config.saved')}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
