import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReportedListingItem } from '@/types/admin';
import { ServerDataTable } from '../components/ServerDataTable';
import { ModerationActionPanel } from '../components/ModerationActionPanel';
import { useReportedListings, useModerateListing } from '../hooks/useModeration';

const LIMIT = 20;

export function ModerationListingsPage() {
  const { t } = useTranslation('admin');
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useReportedListings({ offset, limit: LIMIT });
  const moderate = useModerateListing();

  const items = data?.data ?? [];
  const selected = items.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('moderation.listings_title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('moderation.listings_subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ServerDataTable<ReportedListingItem>
          columns={[
            { key: 'title', label: t('moderation.col_title'), render: (r) => r.title },
            { key: 'reports', label: t('moderation.col_reports'), render: (r) => String(r.reports_count) },
            {
              key: 'last_report_at',
              label: t('moderation.col_last_reported'),
              render: (r) => (r.last_report_at ? new Date(r.last_report_at).toLocaleDateString() : '—'),
            },
          ]}
          data={items}
          total={data?.total ?? 0}
          offset={offset}
          limit={LIMIT}
          onPageChange={setOffset}
          onRowClick={(r) => setSelectedId(r.id)}
          rowKey={(r) => r.id}
          loading={isLoading}
          emptyMessage={t('moderation.empty')}
        />

        {selected ? (
          <ModerationActionPanel
            targetType="listing"
            targetId={selected.id}
            reportCount={selected.reports_count}
            reasons={selected.last_reason ? [selected.last_reason] : undefined}
            loading={moderate.isPending}
            onModerate={(action, reason) =>
              moderate.mutate({ id: selected.id, action, reason }, { onSuccess: () => setSelectedId(null) })
            }
          />
        ) : (
          <p className="py-8 text-center text-sm text-admin-muted">{t('moderation.select_item')}</p>
        )}
      </div>
    </div>
  );
}
