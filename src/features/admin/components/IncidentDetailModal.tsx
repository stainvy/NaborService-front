import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { mediaUrl } from '@/lib/media';
import { NeighbourhoodMap } from './NeighbourhoodMap';
import { INCIDENT_SEVERITIES, type Incident, type IncidentSeverity } from '@/types/incident';
import type { Neighbourhood } from '@/types/geo';
import {
  useUpdateIncident,
  useDeleteIncident,
  useAssignIncident,
  useResolveIncident,
} from '../hooks/useIncidents';

const SEVERITY_CLASSES: Record<IncidentSeverity, string> = {
  low: 'bg-admin-bg text-admin-muted',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

interface IncidentDetailModalProps {
  incident: Incident | null;
  neighbourhood: Neighbourhood | undefined;
  onClose: () => void;
}

export function IncidentDetailModal({ incident, neighbourhood, onClose }: IncidentDetailModalProps) {
  const { t } = useTranslation('admin');
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [confirmAction, setConfirmAction] = useState<'delete' | 'resolve' | null>(null);

  const updateIncident = useUpdateIncident();
  const deleteIncident = useDeleteIncident();
  const assignIncident = useAssignIncident();
  const resolveIncident = useResolveIncident();

  useEffect(() => {
    if (incident) {
      setTitle(incident.title);
      setDescription(incident.description ?? '');
      setSeverity(incident.severity);
      setEditing(false);
    }
  }, [incident]);

  if (!incident) return null;

  const loading =
    updateIncident.isPending || deleteIncident.isPending || assignIncident.isPending || resolveIncident.isPending;

  function saveEdit() {
    if (!incident) return;
    updateIncident.mutate(
      { id: incident.id, payload: { title, description, severity } },
      { onSuccess: () => setEditing(false) },
    );
  }

  function confirmRun() {
    if (!incident || !confirmAction) return;
    if (confirmAction === 'delete') {
      deleteIncident.mutate(incident.id, { onSuccess: () => { setConfirmAction(null); onClose(); } });
    } else {
      resolveIncident.mutate(incident.id, { onSuccess: () => setConfirmAction(null) });
    }
  }

  return (
    <>
      <Modal open onClose={onClose} title={t('incidents.detail_title')}>
        <div className="flex max-h-[75vh] w-[32rem] max-w-full flex-col gap-4 overflow-y-auto">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SEVERITY_CLASSES[incident.severity]}`}>
              {t(`incidents.severity_${incident.severity}`)}
            </span>
            <span className="rounded-full bg-admin-bg px-2 py-0.5 text-[10px] font-medium text-admin-text">
              {t(`incidents.status_${incident.status}`)}
            </span>
          </div>

          {editing ? (
            <div className="flex flex-col gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded border border-admin-border px-3 py-1.5 text-sm outline-none focus:border-admin-accent"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
              <div className="flex gap-2">
                <Button tone="admin" onClick={saveEdit} disabled={loading || !title.trim()}>
                  {t('config.save')}
                </Button>
                <Button tone="admin" variant="secondary" onClick={() => setEditing(false)} disabled={loading}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-admin-text">{incident.title}</h3>
              {incident.description && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-admin-text">{incident.description}</p>
              )}
              <button onClick={() => setEditing(true)} className="mt-2 text-xs text-admin-accent underline">
                {t('incidents.edit')}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-admin-text">
            <span className="text-admin-muted">{t('incidents.col_reporter')}:</span>
            <span className="font-mono">{incident.reporterId}</span>
            <span className="text-admin-muted">{t('incidents.col_assignee')}:</span>
            <span className="font-mono">{incident.assignedTo ?? '—'}</span>
            <span className="text-admin-muted">{t('incidents.col_created')}:</span>
            <span>{new Date(incident.createdAt).toLocaleString()}</span>
            {incident.resolvedAt && (
              <>
                <span className="text-admin-muted">{t('incidents.resolved_at')}:</span>
                <span>{new Date(incident.resolvedAt).toLocaleString()}</span>
              </>
            )}
          </div>

          {incident.locationHint && (
            <p className="text-xs text-admin-muted">
              {t('incidents.location_hint')}: <span className="text-admin-text">{incident.locationHint}</span>
            </p>
          )}

          {/* Localisation — résolue via le quartier de l'incident (l'incident lui-même
              ne porte pas de coordonnées, seulement neighbourhood_id) */}
          <div>
            <p className="mb-1 text-xs font-medium text-admin-muted">{t('incidents.map_title')}</p>
            {neighbourhood?.geometry ? (
              <>
                <NeighbourhoodMap geojson={neighbourhood.geometry} centroid={neighbourhood.centroid} height="200px" />
                <p className="mt-1 text-xs text-admin-text">{neighbourhood.name}</p>
              </>
            ) : (
              <p className="text-xs text-admin-muted">{t('incidents.no_map')}</p>
            )}
          </div>

          {incident.photos && incident.photos.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-admin-muted">{t('incidents.photos')}</p>
              <div className="flex flex-wrap gap-2">
                {incident.photos.map((p, i) => {
                  const url = mediaUrl(p.mediaId);
                  return url ? (
                    <img key={i} src={url} alt="" className="h-16 w-16 rounded border border-admin-border object-cover" />
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-admin-border pt-3">
            {incident.status !== 'resolved' && (
              <>
                <Button
                  tone="admin"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => assignIncident.mutate({ id: incident.id })}
                >
                  {t('incidents.assign_to_me')}
                </Button>
                <Button tone="admin" disabled={loading} onClick={() => setConfirmAction('resolve')}>
                  {t('incidents.action_resolve')}
                </Button>
              </>
            )}
            <Button
              tone="admin"
              disabled={loading}
              onClick={() => setConfirmAction('delete')}
              className="!bg-error hover:!opacity-90"
            >
              {t('incidents.action_delete')}
            </Button>
          </div>

          <div className="flex justify-end">
            <Button tone="admin" variant="secondary" onClick={onClose}>
              {t('users.close')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmAction !== null}
        tone="admin"
        destructive={confirmAction === 'delete'}
        title={confirmAction === 'delete' ? t('incidents.action_delete') : t('incidents.action_resolve')}
        message={confirmAction === 'delete' ? t('incidents.confirm_delete') : t('incidents.confirm_resolve')}
        loading={loading}
        onConfirm={confirmRun}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
