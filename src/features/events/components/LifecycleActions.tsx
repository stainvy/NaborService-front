import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import {
  useCancelEvent,
  useCompleteEvent,
  useOpenEvent,
  usePublishEvent,
} from '../hooks/useEventLifecycle';
import type { NaborEvent } from '../types';

// Actions du créateur selon le statut : draft → publish → open → complete,
// + annulation (motif obligatoire). Le back reste l'autorité finale.
export function LifecycleActions({ event }: { event: NaborEvent }) {
  const { t } = useTranslation('events');
  const { id, status } = event;

  const publish = usePublishEvent(id);
  const openEvent = useOpenEvent(id);
  const complete = useCompleteEvent(id);
  const cancel = useCancelEvent(id);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const active = status !== 'completed' && status !== 'cancelled';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'draft' && (
        <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
          {t('actions.publish')}
        </Button>
      )}
      {status === 'published' && (
        <Button onClick={() => openEvent.mutate()} disabled={openEvent.isPending}>
          {t('actions.open')}
        </Button>
      )}
      {(status === 'open' || status === 'in_progress') && (
        <Button onClick={() => complete.mutate()} disabled={complete.isPending}>
          {t('actions.complete')}
        </Button>
      )}
      {active && (
        <Button variant="secondary" onClick={() => setCancelOpen(true)} disabled={cancel.isPending}>
          {t('actions.cancel')}
        </Button>
      )}

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title={t('actions.cancel')}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            cancel.mutate(reason, { onSuccess: () => setCancelOpen(false) });
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
