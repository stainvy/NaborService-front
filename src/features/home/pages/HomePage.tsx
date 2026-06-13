import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { hasMinRole } from '@/types/roles';
import { Button } from '@/components/Button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/** Placeholder de l'accueil habitant (zone protégée). */
export function HomePage() {
  const { t } = useTranslation('common');
  const { user, role, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white p-6">
      <header className="flex items-center justify-between border-b border-gray/30 pb-4">
        <h1 className="text-xl font-bold text-navy">{t('app.name')}</h1>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link to="/sessions" className="text-sm font-medium text-navy underline">
            {t('nav.sessions')}
          </Link>
          {hasMinRole(role, 'moderator') && (
            <Link to="/admin" className="text-sm font-medium text-navy underline">
              {t('nav.admin')}
            </Link>
          )}
          <Button variant="secondary" onClick={() => void logout()}>
            {t('actions.logout')}
          </Button>
        </div>
      </header>

      <main className="mt-8">
        <p className="text-gray">{t('app.tagline')}</p>
        {user && (
          <p className="mt-2 text-sm text-gray">
            {user.firstName} {user.lastName} ({user.email}) — {role}
          </p>
        )}
      </main>
    </div>
  );
}
