import { useTranslation } from 'react-i18next';
import { StatsOverview } from '../components/StatsOverview';

export function AdminDashboardPage() {
  const { t } = useTranslation('admin');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-admin-text">{t('dashboard.title')}</h2>
        <p className="mt-1 text-sm text-admin-muted">{t('dashboard.subtitle')}</p>
      </div>

      <StatsOverview />
    </div>
  );
}
