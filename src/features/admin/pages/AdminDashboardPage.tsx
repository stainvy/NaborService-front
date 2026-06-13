import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function AdminDashboardPage() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-xl font-bold text-navy">{t('nav.admin')}</h1>
      <p className="mt-4 text-gray">Placeholder back-office — réservé modérateurs et admins.</p>
      <Link to="/" className="mt-4 inline-block text-sm text-orange underline">
        ← {t('nav.home')}
      </Link>
    </div>
  );
}
