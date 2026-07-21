import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Toggle } from '@/components/Toggle';
import { ConfirmTotpModal } from '@/components/ConfirmTotpModal';
import { useDeleteAccount } from '../hooks/useProfile';
import {
  useExportData,
  useRectifyData,
  useOptOuts,
  useOptOut,
  useCancelOptOut,
  useRestrictProcessing,
} from '../hooks/useRgpd';
import { PROCESSING_TYPES, type ProcessingType } from '../types';

interface RectifyForm {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export function PrivacyPage() {
  const { t } = useTranslation('profile');
  const exportData = useExportData();
  const rectify = useRectifyData();
  const deleteAccount = useDeleteAccount();
  const optOuts = useOptOuts();
  const optOut = useOptOut();
  const cancelOptOut = useCancelOptOut();
  const restrict = useRestrictProcessing();

  const [pending, setPending] = useState<null | 'rectify' | 'delete'>(null);
  const rectifyForm = useForm<RectifyForm>();
  const submitRectify = rectifyForm.handleSubmit(() => setPending('rectify'));

  // Normalisation tolérante : les items d'opt-out peuvent être des chaînes ou
  // des objets { processingType } (forme non confirmée par le back).
  const activeOptOuts = new Set(
    ((optOuts.data?.optOuts ?? []) as unknown[]).map((o) =>
      typeof o === 'string' ? o : (o as { processingType?: string })?.processingType,
    ),
  );

  const onConfirmTotp = (code: string) => {
    if (pending === 'rectify') {
      rectify.mutate(
        { ...rectifyForm.getValues(), totpCode: code },
        { onSuccess: () => (setPending(null), rectifyForm.reset()) },
      );
    } else if (pending === 'delete') {
      deleteAccount.mutate({ totpCode: code });
    }
  };

  const activeMutation = pending === 'rectify' ? rectify : deleteAccount;

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-surface p-6">
      <h1 className="mb-6 text-xl font-bold text-fg">{t('privacy.title')}</h1>

      {/* Export */}
      <section className="mb-8">
        <h2 className="font-semibold text-fg">{t('privacy.export.title')}</h2>
        <p className="mb-3 text-sm text-gray">{t('privacy.export.hint')}</p>
        <div className="flex gap-2">
          <Button onClick={() => exportData.mutate('json')} disabled={exportData.isPending}>
            {t('privacy.export.json')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => exportData.mutate('csv')}
            disabled={exportData.isPending}
          >
            {t('privacy.export.csv')}
          </Button>
        </div>
      </section>

      {/* Rectification */}
      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-fg">{t('privacy.rectify.title')}</h2>
        <form onSubmit={submitRectify} className="flex flex-col gap-4">
          <TextField label={t('profile.first_name')} {...rectifyForm.register('firstName')} />
          <TextField label={t('profile.last_name')} {...rectifyForm.register('lastName')} />
          <TextField
            label={t('security.new_email')}
            type="email"
            {...rectifyForm.register('email')}
          />
          {rectify.isSuccess && <p className="text-sm text-success">{t('privacy.rectify.done')}</p>}
          <Button type="submit">{t('privacy.rectify.submit')}</Button>
        </form>
      </section>

      {/* Opposition */}
      <section className="mb-8">
        <h2 className="font-semibold text-fg">{t('privacy.opt_out.title')}</h2>
        <p className="mb-3 text-sm text-gray">{t('privacy.opt_out.hint')}</p>
        <div className="flex flex-col divide-y divide-gray/20">
          {PROCESSING_TYPES.map((type: ProcessingType) => {
            const isOut = activeOptOuts.has(type);
            return (
              <Toggle
                key={type}
                label={t(`privacy.opt_out.${type}`)}
                checked={isOut}
                disabled={optOut.isPending || cancelOptOut.isPending}
                // coché = opposition active
                onChange={(checked) => (checked ? optOut.mutate(type) : cancelOptOut.mutate(type))}
              />
            );
          })}
        </div>
      </section>

      {/* Limitation */}
      <section className="mb-8">
        <h2 className="font-semibold text-fg">{t('privacy.restrict.title')}</h2>
        <p className="mb-3 text-sm text-gray">{t('privacy.restrict.hint')}</p>
        <Button variant="secondary" onClick={() => restrict.mutate()} disabled={restrict.isPending}>
          {t('privacy.restrict.enable')}
        </Button>
        {restrict.isSuccess && (
          <p className="mt-2 text-sm text-success">{t('privacy.restrict.done')}</p>
        )}
      </section>

      {/* Suppression de compte */}
      <section className="rounded-md border border-error/40 p-4">
        <h2 className="font-semibold text-error">{t('privacy.delete.title')}</h2>
        <p className="mb-3 text-sm text-gray">{t('privacy.delete.warning')}</p>
        <button
          type="button"
          onClick={() => setPending('delete')}
          className="rounded-md bg-error px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          {t('privacy.delete.button')}
        </button>
      </section>

      <ConfirmTotpModal
        open={pending !== null}
        title={pending === 'delete' ? t('privacy.delete.totp_title') : t('security.totp_title')}
        onClose={() => setPending(null)}
        onConfirm={onConfirmTotp}
        isPending={activeMutation.isPending}
        isError={activeMutation.isError}
      />
    </div>
  );
}
