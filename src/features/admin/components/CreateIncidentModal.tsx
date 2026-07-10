import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { INCIDENT_SEVERITIES, type IncidentSeverity } from '@/types/incident';
import type { Neighbourhood } from '@/types/geo';
import { useCreateIncident } from '../hooks/useIncidents';

interface CreateIncidentModalProps {
  open: boolean;
  neighbourhoods: Neighbourhood[];
  onClose: () => void;
}

export function CreateIncidentModal({ open, neighbourhoods, onClose }: CreateIncidentModalProps) {
  const { t } = useTranslation('admin');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [neighbourhoodId, setNeighbourhoodId] = useState('');
  const createIncident = useCreateIncident();

  function reset() {
    setTitle('');
    setDescription('');
    setSeverity('medium');
    setNeighbourhoodId('');
  }

  function handleCreate() {
    if (!title.trim()) return;
    createIncident.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        neighbourhood_id: neighbourhoodId || undefined,
        severity,
      },
      { onSuccess: () => { reset(); onClose(); } },
    );
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={t('incidents.create_title')}>
      <div className="flex w-80 max-w-full flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('incidents.col_title')}
          className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('incidents.description_placeholder')}
          rows={3}
          className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent"
        />
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
          className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent"
        >
          {INCIDENT_SEVERITIES.map((s) => (
            <option key={s} value={s}>{t(`incidents.severity_${s}`)}</option>
          ))}
        </select>
        <select
          value={neighbourhoodId}
          onChange={(e) => setNeighbourhoodId(e.target.value)}
          className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent"
        >
          <option value="">{t('incidents.no_neighbourhood')}</option>
          {neighbourhoods.map((nb) => (
            <option key={nb.pgId} value={nb.pgId}>{nb.name}</option>
          ))}
        </select>

        <div className="mt-2 flex justify-end gap-2">
          <Button tone="admin" variant="secondary" onClick={onClose} disabled={createIncident.isPending}>
            {t('common.cancel')}
          </Button>
          <Button tone="admin" onClick={handleCreate} disabled={createIncident.isPending || !title.trim()}>
            {createIncident.isPending ? '…' : t('incidents.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
