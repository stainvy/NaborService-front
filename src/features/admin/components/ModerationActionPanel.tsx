import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { ModerationActionType, ModerationTargetType } from '@/types/admin';

interface ModerationActionPanelProps {
  targetType: ModerationTargetType;
  targetId: string;
  reportCount: number;
  reasons?: string[];
  loading?: boolean;
  onModerate: (action: ModerationActionType, reason: string) => void;
}

// Clés i18n indépendantes des valeurs envoyées à l'API (cancelled/warned/restored,
// confirmées via /api-json — ModerateDto/ModerateListingDto).
const LABEL_KEYS: Record<ModerationActionType, string> = {
  cancelled: 'action_cancel',
  warned: 'action_warn',
  restored: 'action_restore',
};

const CONFIRM_KEYS: Record<ModerationActionType, string> = {
  cancelled: 'confirm_cancel',
  warned: 'confirm_warn',
  restored: 'confirm_restore',
};

export function ModerationActionPanel({
  targetId,
  reportCount,
  reasons,
  loading,
  onModerate,
}: ModerationActionPanelProps) {
  const { t } = useTranslation('admin');
  const [reasonText, setReasonText] = useState('');
  const [pendingAction, setPendingAction] = useState<ModerationActionType | null>(null);

  const reasonValid = reasonText.trim().length > 0;

  function confirm() {
    if (!pendingAction || !reasonValid) return;
    onModerate(pendingAction, reasonText.trim());
    setPendingAction(null);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-admin-border bg-admin-surface p-4">
      <div className="flex items-center gap-2 text-sm text-admin-text">
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          {reportCount} {t('moderation.col_reports').toLowerCase()}
        </span>
        <code className="font-mono text-xs text-admin-muted">{targetId}</code>
      </div>

      {reasons && reasons.length > 0 && (
        <p className="text-xs text-admin-muted">{t('moderation.col_reasons')}: {reasons.join(', ')}</p>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-admin-muted">{t('moderation.reason_label')} *</label>
        <input
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
          placeholder={t('moderation.reason_placeholder')}
          className="w-full rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button tone="admin" disabled={loading || !reasonValid} onClick={() => setPendingAction('warned')}>
          {t(`moderation.${LABEL_KEYS.warned}`)}
        </Button>
        <Button tone="admin" variant="secondary" disabled={loading || !reasonValid} onClick={() => setPendingAction('restored')}>
          {t(`moderation.${LABEL_KEYS.restored}`)}
        </Button>
        <Button tone="admin" disabled={loading || !reasonValid} onClick={() => setPendingAction('cancelled')} className="!bg-error hover:!opacity-90">
          {t(`moderation.${LABEL_KEYS.cancelled}`)}
        </Button>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        tone="admin"
        destructive={pendingAction === 'cancelled'}
        title={pendingAction ? t(`moderation.${LABEL_KEYS[pendingAction]}`) : ''}
        message={pendingAction ? t(`moderation.${CONFIRM_KEYS[pendingAction]}`) : ''}
        loading={loading}
        onConfirm={confirm}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
