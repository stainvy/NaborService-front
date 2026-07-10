import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/Button';
import { ServerDataTable } from '../components/ServerDataTable';
import { IncidentDetailModal } from '../components/IncidentDetailModal';
import { CreateIncidentModal } from '../components/CreateIncidentModal';
import { useIncidents } from '../hooks/useIncidents';
import { useAdminNeighbourhoods } from '../hooks/useNeighbourhoodAdmin';
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES, type Incident, type IncidentSeverity, type IncidentStatus } from '@/types/incident';

const LIMIT = 20;

const SEVERITY_BADGE: Record<IncidentSeverity, string> = {
  low: 'bg-admin-bg text-admin-muted',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

export function AdminIncidentsPage() {
  const { t } = useTranslation('admin');
  const [status, setStatus] = useState<IncidentStatus | ''>('');
  const [severity, setSeverity] = useState<IncidentSeverity | ''>('');
  const [neighbourhoodId, setNeighbourhoodId] = useState('');
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useIncidents({
    status: status || undefined,
    severity: severity || undefined,
    neighbourhood_id: neighbourhoodId || undefined,
    offset,
    limit: LIMIT,
  });
  const { data: neighbourhoods = [] } = useAdminNeighbourhoods();

  const items = data?.data ?? [];
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const selectedNeighbourhood = selected
    ? neighbourhoods.find((nb) => nb.pgId === selected.neighbourhoodId)
    : undefined;

  function resetFilters(fn: () => void) {
    fn();
    setOffset(0);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-admin-text">{t('incidents.title')}</h2>
          <p className="mt-1 text-sm text-admin-muted">{t('incidents.subtitle')}</p>
        </div>
        <Button tone="admin" onClick={() => setCreateOpen(true)}>
          + {t('incidents.create')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => resetFilters(() => setStatus(e.target.value as IncidentStatus | ''))}
          className="rounded-md border border-admin-border px-3 py-2 text-sm outline-none focus:border-admin-accent"
        >
          <option value="">{t('incidents.all_statuses')}</option>
          {INCIDENT_STATUSES.map((s) => (
            <option key={s} value={s}>{t(`incidents.status_${s}`)}</option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(e) => resetFilters(() => setSeverity(e.target.value as IncidentSeverity | ''))}
          className="rounded-md border border-admin-border px-3 py-2 text-sm outline-none focus:border-admin-accent"
        >
          <option value="">{t('incidents.all_severities')}</option>
          {INCIDENT_SEVERITIES.map((s) => (
            <option key={s} value={s}>{t(`incidents.severity_${s}`)}</option>
          ))}
        </select>
        <select
          value={neighbourhoodId}
          onChange={(e) => resetFilters(() => setNeighbourhoodId(e.target.value))}
          className="rounded-md border border-admin-border px-3 py-2 text-sm outline-none focus:border-admin-accent"
        >
          <option value="">{t('incidents.all_neighbourhoods')}</option>
          {neighbourhoods.map((nb) => (
            <option key={nb.pgId} value={nb.pgId}>{nb.name}</option>
          ))}
        </select>
      </div>

      <ServerDataTable<Incident>
        columns={[
          { key: 'title', label: t('incidents.col_title') },
          {
            key: 'severity',
            label: t('incidents.col_severity'),
            render: (i) => (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SEVERITY_BADGE[i.severity]}`}>
                {t(`incidents.severity_${i.severity}`)}
              </span>
            ),
          },
          { key: 'status', label: t('incidents.col_status'), render: (i) => t(`incidents.status_${i.status}`) },
          {
            key: 'neighbourhood',
            label: t('incidents.col_neighbourhood'),
            render: (i) => neighbourhoods.find((nb) => nb.pgId === i.neighbourhoodId)?.name ?? i.neighbourhoodId ?? '—',
          },
          { key: 'createdAt', label: t('incidents.col_created'), render: (i) => new Date(i.createdAt).toLocaleDateString() },
        ]}
        data={items}
        total={data?.meta.total ?? 0}
        offset={offset}
        limit={LIMIT}
        onPageChange={setOffset}
        onRowClick={(i) => setSelectedId(i.id)}
        rowKey={(i) => i.id}
        loading={isLoading}
        emptyMessage={t('incidents.empty')}
      />

      <IncidentDetailModal incident={selected} neighbourhood={selectedNeighbourhood} onClose={() => setSelectedId(null)} />
      <CreateIncidentModal open={createOpen} neighbourhoods={neighbourhoods} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
