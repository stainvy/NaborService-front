import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { useAdjustPoints } from '../hooks/useAdminPoints';

interface AdjustPointsModalProps {
  open: boolean;
  userId: string;
  userLabel?: string;
  onClose: () => void;
}

type Direction = 'credit' | 'debit';

export function AdjustPointsModal({ open, userId, userLabel, onClose }: AdjustPointsModalProps) {
  const { t } = useTranslation('admin');
  const [direction, setDirection] = useState<Direction>('credit');
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<{ balanceAfterPoints: number } | null>(null);

  const adjust = useAdjustPoints();

  const amount = Math.trunc(Number(amountText));
  const amountValid = amountText.trim() !== '' && Number.isFinite(amount) && amount > 0;

  function reset() {
    setDirection('credit');
    setAmountText('');
    setDescription('');
    setResult(null);
    adjust.reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    if (!amountValid) return;
    const amountPoints = direction === 'debit' ? -amount : amount;
    adjust.mutate(
      { userId, amountPoints, description: description.trim() || undefined },
      {
        onSuccess: (data) => {
          setResult({ balanceAfterPoints: data.balanceAfterPoints });
          setAmountText('');
          setDescription('');
        },
      },
    );
  }

  let errorMessage: string | null = null;
  if (adjust.isError) {
    if (isAxiosError(adjust.error) && adjust.error.response?.status === 409) {
      errorMessage = t('points.adjust.error_conflict');
    } else if (isAxiosError(adjust.error) && adjust.error.response?.status === 404) {
      errorMessage = t('points.adjust.error_not_found');
    } else {
      errorMessage = t('points.adjust.error_generic');
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('points.adjust.title')}>
      <div className="flex flex-col gap-4">
        {userLabel && <p className="text-sm text-admin-muted">{userLabel}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDirection('credit')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
              direction === 'credit'
                ? 'border-admin-accent bg-admin-accent/10 text-admin-accent'
                : 'border-admin-border text-admin-text'
            }`}
          >
            {t('points.adjust.direction_add')}
          </button>
          <button
            type="button"
            onClick={() => setDirection('debit')}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
              direction === 'debit'
                ? 'border-error bg-error/10 text-error'
                : 'border-admin-border text-admin-text'
            }`}
          >
            {t('points.adjust.direction_remove')}
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-admin-muted">
            {t('points.adjust.amount_label')}
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            className="w-full rounded-md border border-admin-border px-3 py-2 text-sm outline-none focus:border-admin-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-admin-muted">
            {t('points.adjust.description_label')}
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            placeholder={t('points.adjust.description_placeholder')}
            className="w-full rounded-md border border-admin-border px-3 py-2 text-sm outline-none focus:border-admin-accent"
          />
        </div>

        {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}
        {result && (
          <p className="text-sm text-green-700">
            {t('points.adjust.success', { points: result.balanceAfterPoints })}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-admin-border pt-4">
          <Button type="button" tone="admin" variant="secondary" onClick={handleClose}>
            {t('points.adjust.cancel')}
          </Button>
          <Button
            type="button"
            tone="admin"
            disabled={!amountValid || adjust.isPending}
            onClick={handleSubmit}
          >
            {adjust.isPending ? '…' : t('points.adjust.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
