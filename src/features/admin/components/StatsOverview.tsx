import { useTranslation } from 'react-i18next';
import { BreakdownBarChart } from './BreakdownBarChart';
import {
  useStatsOverview,
  useStatsListings,
  useStatsEvents,
  useStatsPayments,
  useStatsUsers,
  useStatsIncidents,
} from '../hooks/useAdminStats';

function StatTile({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="rounded-lg border border-admin-border bg-admin-surface p-4">
      <p className="text-xs font-medium text-admin-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-admin-text">{value ?? '—'}</p>
    </div>
  );
}

function formatCents(cents: number | undefined): string | undefined {
  if (cents === undefined) return undefined;
  return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'EUR' });
}

export function StatsOverview() {
  const { t } = useTranslation('admin');
  const overview = useStatsOverview();
  const listings = useStatsListings();
  const events = useStatsEvents();
  const payments = useStatsPayments();
  const users = useStatsUsers();
  const incidents = useStatsIncidents();

  if (overview.isLoading) {
    return <p className="text-sm text-admin-muted">{t('dashboard.loading')}</p>;
  }
  if (overview.isError) {
    return <p className="text-sm text-red-600">{t('dashboard.error')}</p>;
  }

  const tiles = [
    { key: 'users', label: t('dashboard.tile_users'), value: overview.data?.totalUsers },
    { key: 'listings', label: t('dashboard.tile_listings'), value: overview.data?.totalListings },
    { key: 'events', label: t('dashboard.tile_events'), value: overview.data?.totalEvents },
    { key: 'incidents', label: t('dashboard.tile_incidents'), value: overview.data?.activeIncidents },
    { key: 'payments', label: t('dashboard.tile_payments'), value: formatCents(overview.data?.totalPaymentsCents) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {tiles.map((tile) => (
          <StatTile key={tile.key} label={tile.label} value={tile.value} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownBarChart
          title={t('dashboard.chart_users_by_role')}
          data={(users.data?.roleBreakdown ?? []).map((b) => ({ label: b.role, count: b.count }))}
        />
        <BreakdownBarChart
          title={t('dashboard.chart_listings_by_status')}
          data={(listings.data?.statusBreakdown ?? []).map((b) => ({ label: b.status, count: b.count }))}
        />
        <BreakdownBarChart
          title={t('dashboard.chart_events_by_status')}
          data={(events.data?.statusBreakdown ?? []).map((b) => ({ label: b.status, count: b.count }))}
        />
        <BreakdownBarChart
          title={t('dashboard.chart_incidents_by_severity')}
          data={(incidents.data?.severityBreakdown ?? []).map((b) => ({ label: b.severity, count: b.count }))}
        />
        <BreakdownBarChart
          title={t('dashboard.chart_payments_by_status')}
          data={(payments.data?.statusBreakdown ?? []).map((b) => ({ label: b.status, count: b.count }))}
        />
      </div>
    </div>
  );
}
