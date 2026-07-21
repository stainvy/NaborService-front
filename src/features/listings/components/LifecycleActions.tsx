import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import {
  useAcceptInterest,
  useCancelListing,
  useConfirmExecution,
  useExpressInterest,
} from '../hooks/useLifecycle';
import type { Listing } from '../types';

interface Props {
  listing: Listing;
  isCreator: boolean;
}

// Affiche l'action possible selon le statut et le rôle. Le back reste l'autorité
// finale ; on ne montre que les transitions plausibles.
export function LifecycleActions({ listing, isCreator }: Props) {
  const { t } = useTranslation('listings');
  const { id, status } = listing;

  const interest = useExpressInterest(id);
  const accept = useAcceptInterest(id);
  const confirm = useConfirmExecution(id);
  const cancel = useCancelListing(id);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  const active = status !== 'closed' && status !== 'cancelled';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'open' && !isCreator && (
        <Button onClick={() => interest.mutate()} disabled={interest.isPending}>
          {t('actions.interest')}
        </Button>
      )}

      {status === 'pending' && isCreator && (
        <Button onClick={() => accept.mutate()} disabled={accept.isPending}>
          {t('actions.accept')}
        </Button>
      )}

      {status === 'in_progress' && (
        <Button onClick={() => confirm.mutate()} disabled={confirm.isPending}>
          {t('actions.confirm')}
        </Button>
      )}

      {active && isCreator && (
        <Button variant="secondary" onClick={() => setCancelOpen(true)} disabled={cancel.isPending}>
          {t('actions.cancel')}
        </Button>
      )}

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title={t('actions.cancel')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            cancel.mutate({ reason }, { onSuccess: () => setCancelOpen(false) });
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg">{t('actions.cancel_reason')}</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              className="rounded-md border border-gray px-3 py-2 focus:border-navy focus:outline-none"
            />
          </label>
          <Button type="submit" disabled={cancel.isPending || reason.trim().length === 0}>
            {t('actions.cancel_confirm')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
