import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** Placeholder de la page d'inscription (formulaire à venir avec le module Auth). */
export function RegisterPage() {
  const { t } = useTranslation('auth');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white p-6">
      <h1 className="text-2xl font-bold text-navy">{t('register.title')}</h1>
      <p className="text-gray">Placeholder — formulaire à venir avec le module Auth.</p>
      <Link to="/login" className="text-sm text-orange underline">
        {t('register.to_login')}
      </Link>
    </div>
  );
}
