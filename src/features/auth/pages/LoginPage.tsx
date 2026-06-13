import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function LoginPage() {
  const { t } = useTranslation('auth');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <h1 className="text-2xl font-bold text-navy">{t('login.title')}</h1>
      <p className="text-gray">Placeholder — formulaire à venir avec le module Auth.</p>
      <Link to="/register" className="text-sm text-orange underline">
        {t('login.to_register')}
      </Link>
    </div>
  );
}
