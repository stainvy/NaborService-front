import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ServerDataTable } from '../components/ServerDataTable';
import { AdjustPointsModal } from '../components/AdjustPointsModal';
import { Button } from '@/components/Button';
import { useAdminPointsLedger } from '../hooks/useAdminPoints';
import type { PointsLedgerEntry, PointsLedgerEntryType } from '@/services/points.service';

const LIMIT = 20;

const LEDGER_TYPES: PointsLedgerEntryType[] = [
  'topup',
  'listing_hold',
  'listing_payout',
  'listing_refund',
  'listing_commission',
  'event_hold',
  'event_payout',
  'event_refund',
  'event_commission',
  'event_reward',
  'adjustment',
  'admin_adjustment',
  'cashout',
  'cashout_reversed',
];

export function AdminPointsPage() {
  const { t } = useTranslation('admin');
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState(searchParams.get('userId') ?? '');
  const [type, setType] = useState<PointsLedgerEntryType | ''>('');
  const [offset, setOffset] = useState(0);
  const [adjusting, setAdjusting] = useState(false);

  const { data, isLoading } = useAdminPointsLedger({
    userId: userId || undefined,
    type: type || undefined,
    offset,
    limit: LIMIT,
  });

  function resetFilters(fn: () => void) {
    fn();
    setOffset(0);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('points.title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('points.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={userId}
          onChange={(e) => resetFilters(() => setUserId(e.target.value))}
          placeholder={t('points.filter_user_placeholder')}
          className="w-72 rounded-md border border-admin-border px-3 py-2 text-sm outline-none focus:border-admin-accent"
        />
        <Button
          type="button"
          tone="admin"
          variant="secondary"
          disabled={!userId}
          onClick={() => setAdjusting(true)}
        >
          {t('points.adjust.button')}
        </Button>
        <select
          value={type}
          onChange={(e) => resetFilters(() => setType(e.target.value as PointsLedgerEntryType | ''))}
          className="rounded-md border border-admin-border px-3 py-2 text-sm outline-none focus:border-admin-accent"
        >
          <option value="">{t('points.all_types')}</option>
          {LEDGER_TYPES.map((lt) => (
            <option key={lt} value={lt}>
              {t(`points.types.${lt}`)}
            </option>
          ))}
        </select>
      </div>

      <ServerDataTable<PointsLedgerEntry>
        columns={[
          {
            key: 'createdAt',
            label: t('points.col_date'),
            render: (e) => new Date(e.createdAt).toLocaleString(),
          },
          {
            key: 'type',
            label: t('points.col_type'),
            render: (e) => t(`points.types.${e.type}`),
          },
          {
            key: 'userId',
            label: t('points.col_user'),
            render: (e) => e.userId ?? t('points.platform'),
          },
          {
            key: 'amountPoints',
            label: t('points.col_amount'),
            render: (e) => (
              <span className={e.amountPoints >= 0 ? 'text-green-600' : 'text-error'}>
                {e.amountPoints >= 0 ? '+' : ''}
                {e.amountPoints}
              </span>
            ),
          },
          {
            key: 'balanceAfterPoints',
            label: t('points.col_balance_after'),
            render: (e) => e.balanceAfterPoints ?? '—',
          },
          {
            key: 'referenceType',
            label: t('points.col_reference'),
            render: (e) => (e.referenceType ? `${e.referenceType} · ${e.referenceId}` : '—'),
          },
          {
            key: 'description',
            label: t('points.col_description'),
            render: (e) => e.description ?? '—',
          },
        ]}
        data={data?.data ?? []}
        total={data?.meta.total ?? 0}
        offset={offset}
        limit={LIMIT}
        onPageChange={setOffset}
        rowKey={(e) => e.id}
        loading={isLoading}
        emptyMessage={t('points.empty')}
      />

      <AdjustPointsModal
        open={adjusting}
        userId={userId}
        onClose={() => setAdjusting(false)}
      />
    </div>
  );
}
