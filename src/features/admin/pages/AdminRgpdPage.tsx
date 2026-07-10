import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useRgpdRequests, useAnonymizeRgpdRequest } from '../hooks/useRgpdRequests';

export function AdminRgpdPage() {
  const { t } = useTranslation('admin');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // GET /admin/rgpd/requests ne pagine pas côté API (confirmé /api-json) — liste complète.
  const { data, isLoading } = useRgpdRequests();
  const anonymize = useAnonymizeRgpdRequest();
  const requests = data ?? [];

  function confirm() {
    if (!pendingUserId) return;
    anonymize.mutate(pendingUserId, { onSuccess: () => setPendingUserId(null) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('rgpd.title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('rgpd.subtitle')}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-admin-muted">{t('common.loading')}</p>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-admin-border bg-admin-surface px-5 py-8 text-center text-sm text-admin-muted">
          {t('rgpd.empty')}
        </div>
      ) : (
        <div className="overflow-auto rounded-lg border border-admin-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-admin-bg">
                <td className="px-4 py-2.5 font-medium text-admin-text">{t('rgpd.col_user')}</td>
                <td className="px-4 py-2.5 font-medium text-admin-text">{t('rgpd.col_status')}</td>
                <td className="px-4 py-2.5 font-medium text-admin-text">{t('rgpd.col_requested')}</td>
                <td className="px-4 py-2.5 font-medium text-admin-text"></td>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.userId} className="border-b border-admin-border bg-admin-surface last:border-0">
                  <td className="px-4 py-2.5 text-admin-text">
                    {r.firstName} {r.lastName}
                    <span className="ml-1 text-xs text-admin-muted">{r.email}</span>
                  </td>
                  <td className="px-4 py-2.5 text-admin-text">{t(`rgpd.status_${r.status}`)}</td>
                  <td className="px-4 py-2.5 text-admin-text">{new Date(r.deletedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 text-right">
                    {r.status !== 'completed' && (
                      <button onClick={() => setPendingUserId(r.userId)} className="text-xs text-red-500 hover:underline">
                        {t('rgpd.action_anonymize')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingUserId)}
        tone="admin"
        destructive
        title={t('rgpd.action_anonymize')}
        message={t('rgpd.confirm_anonymize')}
        loading={anonymize.isPending}
        onConfirm={confirm}
        onCancel={() => setPendingUserId(null)}
      />
    </div>
  );
}
