import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReportedEventItem } from '@/types/admin';
import { ServerDataTable } from '../components/ServerDataTable';
import { ModerationActionPanel } from '../components/ModerationActionPanel';
import { useReportedEvents, useModerateEvent } from '../hooks/useModeration';

const LIMIT = 20;

export function ModerationEventsPage() {
  const { t } = useTranslation('admin');
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useReportedEvents({ offset, limit: LIMIT });
  const moderate = useModerateEvent();

  const items = data?.data ?? [];
  const selected = items.find((r) => r.event.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('moderation.events_title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('moderation.events_subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ServerDataTable<ReportedEventItem>
          columns={[
            { key: 'title', label: t('moderation.col_title'), render: (r) => r.event.title },
            { key: 'reports', label: t('moderation.col_reports'), render: (r) => String(r.reportCount) },
            {
              key: 'lastReportedAt',
              label: t('moderation.col_last_reported'),
              render: (r) => (r.lastReportedAt ? new Date(r.lastReportedAt).toLocaleDateString() : '—'),
            },
          ]}
          data={items}
          total={data?.meta.total ?? 0}
          offset={offset}
          limit={LIMIT}
          onPageChange={setOffset}
          onRowClick={(r) => setSelectedId(r.event.id)}
          rowKey={(r) => r.event.id}
          loading={isLoading}
          emptyMessage={t('moderation.empty')}
        />

        {selected ? (
          <ModerationActionPanel
            targetType="event"
            targetId={selected.event.id}
            reportCount={selected.reportCount}
            loading={moderate.isPending}
            onModerate={(action, reason) =>
              moderate.mutate({ id: selected.event.id, action, reason }, { onSuccess: () => setSelectedId(null) })
            }
          />
        ) : (
          <p className="py-8 text-center text-sm text-admin-muted">{t('moderation.select_item')}</p>
        )}
      </div>
    </div>
  );
}
