import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation('common');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
      <h1 className="text-4xl font-bold text-fg">404</h1>
      <Link to="/" className="text-orange underline">
        {t('nav.home')}
      </Link>
    </div>
  );
}
